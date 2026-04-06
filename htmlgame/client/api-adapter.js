/*
  API Adapter: Replace legacy index.php calls with Node API.
  - Provides fetch/$.ajax retry helpers.
  - Handles button loading/reset via MUI.
  - Optional auto-binding for the login button when marked.
*/

(function () {
  var API_BASE = window.API_BASE || 'http://localhost:3001';
  var DEFAULT_RETRIES = 2; // total attempts = 1 + retries
  var DEFAULT_BACKOFF_MS = 600; // exponential backoff base

  // Throttle noisy alerts to avoid重复弹窗
  (function throttleAlerts(){
    try {
      var origAlert = window.alert;
      var last = 0; var interval = 4000;
      window.alert = function(msg){
        var now = Date.now();
        if (now - last < interval) { console.warn('Suppressed alert:', msg); return; }
        last = now; origAlert.call(window, msg);
      };
    } catch(e) {}
  })();

  // Block legacy index.php/file:// XHRs that cause CORS提示
  (function preventLegacyPhpRequests(){
    try {
      if (window.$ && typeof window.$.ajaxPrefilter === 'function') {
        window.$.ajaxPrefilter(function(options, originalOptions, jqXHR){
          var url = options && options.url ? String(options.url) : '';
          if (/index\.php/i.test(url) || /^file:/i.test(url)) {
            console.warn('Blocking legacy jQuery request:', url);
            options.beforeSend = function(){ return false; };
          }
        });
      }
    } catch(e) {}
    try {
      var origOpen = XMLHttpRequest.prototype.open;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url){
        this.__blockedLegacy = (url && (/index\.php/i.test(String(url)) || /^file:/i.test(String(url))));
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function(body){
        if (this.__blockedLegacy) {
          console.warn('Blocked legacy XHR send');
          try { this.abort(); } catch(e) {}
          return;
        }
        return origSend.apply(this, arguments);
      };
    } catch(e) {}
  })();

  // Fallback UI router: enable basic tab switching for vt="win,x[,y]"
  (function bindFallbackUiRouter(){
    function showTab(targetId){
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (!target) { console.warn('Tab not found:', targetId); return; }
      // Hide all known tab containers
      var allTabs = document.querySelectorAll('[id^="tab-"]');
      for (var i=0;i<allTabs.length;i++){
        var el = allTabs[i];
        el.style.display = 'none';
      }
      // Ensure game main is visible
      var gameEl = document.getElementById('game');
      if (gameEl) gameEl.style.display = 'block';
      // Show target
      target.style.display = 'block';
    }

    function activateButton(el, cmdPrefix){
      try{
        // Limit scope to nearest container of buttons to avoid global changes
        var container = el.parentElement || document;
        var siblings = container.querySelectorAll('[vt^="'+ cmdPrefix +'"]');
        for (var i=0;i<siblings.length;i++){
          siblings[i].classList && siblings[i].classList.remove('ltnow');
        }
        el.classList && el.classList.add('ltnow');
      }catch(e){ /* silent */ }
    }

    function showPanelsByPrefix(prefix, index){
      if (!prefix || !index) return;
      var wantedId = prefix + 'tab' + index;
      var candidates = document.querySelectorAll('[id^="'+ prefix +'tab"]');
      var found = false;
      for (var i=0;i<candidates.length;i++){
        var n = candidates[i];
        var show = (n.id === wantedId);
        n.style.display = show ? 'block' : 'none';
        if (show) found = true;
      }
      if (!found){
        // No panels matched; do not force anything else
        console.warn('Fallback: no panels for prefix', prefix, 'index', index);
      }
    }

    document.addEventListener('click', function(evt){
      // Only act if no one prevented default (作为兜底，不与原逻辑冲突)
      if (evt.defaultPrevented) return;
      var el = evt.target;
      while (el && el !== document) {
        if (el.classList && el.classList.contains('btn_game')) break;
        el = el.parentNode;
      }
      if (!el || el === document) return;
      var vt = el.getAttribute('vt') || '';
      if (!vt) return;
      var parts = vt.split(',');
      var cmd = parts[0];
      if (cmd === 'win') {
        evt.preventDefault();
        var args = parts.slice(1).filter(Boolean);
        var id = 'tab-' + args.join('-');
        if (!id || id === 'tab-') id = 'tab-1';
        showTab(id);
        activateButton(el, 'win');
        return;
      }
      // Generic tabs like txdy_tab, dongfu_tab, leitai_tab
      if (/^[a-zA-Z0-9]+_tab$/.test(cmd)){
        evt.preventDefault();
        var prefix = cmd.replace(/_tab$/, '');
        var idx = (parts[1] || '').trim();
        if (idx){
          showPanelsByPrefix(prefix, idx);
          activateButton(el, cmd);
        }
        return;
      }
      // Sub-tabs like huantab,group,index -> try groupTabN pattern
      if (cmd === 'huantab'){
        evt.preventDefault();
        var group = (parts[1] || '').trim();
        var idx2 = (parts[2] || '').trim();
        if (group && idx2){
          showPanelsByPrefix(group, idx2);
          activateButton(el, 'huantab,'+group);
        }
        return;
      }
      // 可按需扩展：huantab、map_choose 等
    }, true); // capture phase

    // 默认显示第一个主标签
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ showTab('tab-1'); });
    } else {
      showTab('tab-1');
    }
  })();

  function setButtonLoading(btnEl) {
    try {
      if (window.mui && typeof window.mui.fn.button === 'function') {
        window.mui(btnEl).button('loading');
        return;
      }
    } catch (e) {}
    btnEl.disabled = true;
    btnEl.setAttribute('data-loading', 'true');
  }

  function resetButton(btnEl) {
    try {
      if (window.mui && typeof window.mui.fn.button === 'function') {
        window.mui(btnEl).button('reset');
        return;
      }
    } catch (e) {}
    btnEl.disabled = false;
    btnEl.removeAttribute('data-loading');
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function requestWithRetry(url, options, retries, backoffMs) {
    var attempt = 0;
    var maxRetries = (typeof retries === 'number') ? retries : DEFAULT_RETRIES;
    var baseBackoff = (typeof backoffMs === 'number') ? backoffMs : DEFAULT_BACKOFF_MS;

    while (true) {
      try {
        var res = await fetch(url, options);
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') !== -1) {
          return await res.json();
        }
        return await res.text();
      } catch (err) {
        if (attempt >= maxRetries) {
          throw err;
        }
        var backoff = baseBackoff * Math.pow(2, attempt); // 0,1,2 → 600,1200,2400
        await sleep(backoff);
        attempt++;
      }
    }
  }

  function ajaxWithRetry(opts, retries, backoffMs) {
    var attempt = 0;
    var maxRetries = (typeof retries === 'number') ? retries : DEFAULT_RETRIES;
    var baseBackoff = (typeof backoffMs === 'number') ? backoffMs : DEFAULT_BACKOFF_MS;

    function run(resolve, reject) {
      var finalOpts = Object.assign({}, opts, {
        success: function (data, status, xhr) {
          resolve(data);
        },
        error: async function (xhr, status, err) {
          if (attempt >= maxRetries) {
            reject(err || new Error(status));
            return;
          }
          var backoff = baseBackoff * Math.pow(2, attempt);
          attempt++;
          await sleep(backoff);
          run(resolve, reject);
        }
      });
      window.$.ajax(finalOpts);
    }

    return new Promise(run);
  }

  async function apiLogin(username) {
    var url = API_BASE + '/api/login';
    return requestWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username })
    });
  }

  async function apiGetAreas() {
    var url = API_BASE + '/api/areas';
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiGetCharacters(userId, areaId) {
    var url = API_BASE + '/api/characters?user_id=' + encodeURIComponent(userId) + '&area_id=' + encodeURIComponent(areaId || '');
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiGetCharacter(charId) {
    var url = API_BASE + '/api/characters/' + encodeURIComponent(charId);
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiGetInventoryForCharacter(charId) {
    var url = API_BASE + '/api/characters/' + encodeURIComponent(charId) + '/inventory';
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiGetPets(charId) {
    var url = API_BASE + '/api/pets?character_id=' + encodeURIComponent(charId);
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiGetChat(areaId) {
    var url = API_BASE + '/api/chat?area_id=' + encodeURIComponent(areaId);
    return requestWithRetry(url, { method: 'GET' });
  }

  async function apiSendChat(areaId, senderCharacterId, content, channel) {
    var url = API_BASE + '/api/chat/send';
    return requestWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area_id: areaId, sender_character_id: senderCharacterId, content: content, channel: channel })
    });
  }

  function byId(id){ return document.getElementById(id); }

  function updateUiWithCharacter(char){
    try{
      if(!char) return;
      var start = byId('start');
      var game = byId('game');
      if(start) start.style.display = 'none';
      if(game) game.style.display = 'block';

      var nameEl = byId('user_name');
      var lvlEl = byId('user_lvl');
      var goldEl = byId('user_jinbi');
      var silverEl = byId('user_yinbi');
      var jobImg = byId('user_job');

      if(nameEl) nameEl.textContent = char.name || '';
      if(lvlEl) lvlEl.textContent = String(char.level || 1);
      if(goldEl) goldEl.textContent = String(char.gold || 0);
      if(silverEl) silverEl.textContent = String(char.silver || 0);
      if(jobImg){
        // 简单根据职业映射头像，未知职业用1.png
        var map = { '战士': '1.png', '法师': '2.png' };
        var icon = map[char.job] || '1.png';
        jobImg.src = 'client/head/' + icon;
      }

      // 渲染背包物品（tab-2-1 区域）
      renderInventoryForCharacter(char.id);
    }catch(e){ console.warn('更新角色UI失败', e); }
  }

  async function renderInventoryForCharacter(characterId){
    try{
      var listEl = byId('item_100'); // 背包列表容器
      if(!listEl) return;
      var data = await apiGetInventoryForCharacter(characterId);
      var items = Array.isArray(data) ? data : (data && data.items) || [];
      var html = items.map(function(row){
        var icon = (row.icon_path || '').replace(/^\/?/, '');
        var safeName = row.name || ('物品#' + row.item_id);
        var qty = row.quantity || 1;
        return (
          '<li class="item">'
          + '<img class="item-icon" src="' + icon + '" alt="' + safeName + '" onerror="this.style.display=\'none\'">'
          + '<span class="item-name">' + safeName + '</span>'
          + '<span class="item-qty">x' + qty + '</span>'
          + '</li>'
        );
      }).join('');
      listEl.innerHTML = html || '<li class="item-empty">背包为空</li>';
    }catch(err){
      console.warn('渲染背包失败', err);
    }
  }

  function bindLoginIfMarked() {
    var btn = document.getElementById('btn_login_login');
    if (!btn) return;

    var marked = btn.getAttribute('data-api-adapter');
    if (marked !== 'bind-login') return;

    btn.addEventListener('click', async function (e) {
      // Prevent legacy handlers relying on index.php
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      setButtonLoading(btn);
      try {
        var usernameEl = document.getElementById('login_username');
        var username = usernameEl ? usernameEl.value.trim() : '';
        if (!username) throw new Error('请输入用户名');

        var result = await apiLogin(username);
        console.log('登录成功', result);

        // 读取区服列表，选择第一个开放区
        var areas = await apiGetAreas();
        var area = (areas || []).find(function(a){ return String(a.is_open) === '1'; }) || (areas && areas[0]);
        if(!area) throw new Error('没有可用区服');

        // 查询角色列表
        var chars = await apiGetCharacters(result.user_id, area.id);
        if(chars && chars.length){
          // 使用第一个角色，更新UI
          var char = await apiGetCharacter(chars[0].id);
          updateUiWithCharacter(char);
        }else{
          // 没有角色则仅提示登录成功
          alert('登录成功：' + (result && result.username || username));
        }
      } catch (err) {
        console.error('登录失败', err);
        alert('登录失败：' + (err && err.message ? err.message : String(err)));
      } finally {
        resetButton(btn);
      }
    }, { once: false });
  }

  // Expose helpers for manual use elsewhere
  window.ApiAdapter = {
    requestWithRetry: requestWithRetry,
    ajaxWithRetry: ajaxWithRetry,
    apiLogin: apiLogin,
    apiGetAreas: apiGetAreas,
    apiGetCharacters: apiGetCharacters,
    apiGetCharacter: apiGetCharacter,
    apiGetInventoryForCharacter: apiGetInventoryForCharacter,
    apiGetPets: apiGetPets,
    apiGetChat: apiGetChat,
    apiSendChat: apiSendChat
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLoginIfMarked);
  } else {
    bindLoginIfMarked();
  }
})();