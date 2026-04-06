;(function(){
  function resetStuckButtons(){
    try{
      var stuck = document.querySelectorAll('.mui-btn.mui-disabled, .mui-btn .mui-spinner');
      if(stuck && stuck.length){
        // Use MUI's button plugin to reset state
        if(typeof mui !== 'undefined' && mui.fn && mui.fn.button){
          mui('.mui-btn').button('reset');
        }else{
          // Fallback: enable buttons and clear loading text/spinner markup
          var btns = document.querySelectorAll('.mui-btn');
          btns.forEach(function(el){
            el.disabled = false;
            el.classList.remove('mui-disabled');
          });
        }
      }
    }catch(e){
      // Silent guard
    }
  }

  function ensureGameVisible(){
    var game = document.getElementById('game');
    var start = document.getElementById('start');
    if(game && game.style.display === 'none'){
      game.style.display = 'block';
    }
    if(start && start.style.display !== 'none'){
      start.style.display = 'none';
    }
  }

  function run(){
    // First pass quickly after load
    resetStuckButtons();
    ensureGameVisible();
    // Second pass after a short delay to catch late inits
    setTimeout(function(){
      resetStuckButtons();
      ensureGameVisible();
    }, 1500);
    // Final pass if something is still stuck
    setTimeout(function(){
      resetStuckButtons();
    }, 4000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  }else{
    run();
  }
})();