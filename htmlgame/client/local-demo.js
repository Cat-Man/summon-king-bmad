// Local offline demo script: bypass login and show game UI with sample data
(function(){
  function byId(id){ return document.getElementById(id); }

  function showDemo(){
    var start = byId('start');
    var game = byId('game');
    if(start) start.style.display = 'none';
    if(game) game.style.display = 'block';

    var nameEl = byId('user_name');
    var lvlEl = byId('user_lvl');
    var goldEl = byId('user_jinbi');
    var silverEl = byId('user_yinbi');
    var jobImg = byId('user_job');

    if(nameEl) nameEl.textContent = '演示角色';
    if(lvlEl) lvlEl.textContent = '1';
    if(goldEl) goldEl.textContent = '1000';
    if(silverEl) silverEl.textContent = '0';
    if(jobImg) jobImg.src = 'client/head/1.png';
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', showDemo);
  }else{
    showDemo();
  }
})();