function onLoad()
{
  $(".logo").animate({"top": "35%"}, 600);
  $(".button-container").fadeIn(700);
  attachEventListeners();
}

function attachEventListeners()
{
  // Display login page
  $("#login-btn").click(showLogin);

  // Redirect to sign up page
  $("#signup-btn").click(function(){
    window.location.href = "/signup";
  });
}

function showLogin()
{
  $("#login-btn").unbind("click");
  $(".button-container").fadeOut(500);
  $(".logo").animate({"top": "50%"}, 600);
  $(".start-page-holder").animate({"height": "30%"},
    600,
    function(){
      $(".back").click(hideLogin);
    });
}

function hideLogin()
{
  $(".back").unbind("click");
  $(".button-container").fadeIn(500);
  $(".logo").animate({"top": "35%"}, 600);
  $(".start-page-holder").animate({"height": "100%"},
    600,
    function(){
      $("#login-btn").click(showLogin);
    });

}

$(document).ready(function()
{
  setTimeout(onLoad, 700);
});