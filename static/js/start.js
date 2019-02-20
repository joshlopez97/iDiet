function onLoad()
{
  let action = $("#action").val();
  console.log(action);
  if (action !== "login") {
    $(".logo").animate({"top": "35%"}, 600);
    $(".button-container").fadeIn(700);
  }
  attachEventListeners(action);
}

function attachEventListeners(action)
{
  console.log("attaching event listeners");
  // Display login page
  $("#login-btn").click(showLogin);

  // Redirect to sign up page
  $("#signup-btn").click(function(){
    window.location.href = "/signup";
  });
  if (action === 'login')
  {
    $(".back").click(hideLogin);
  }
}

function showLogin()
{
  console.log("show login");
  $(".errorMsg").css("display", "none");
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
  console.log("hide login");
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