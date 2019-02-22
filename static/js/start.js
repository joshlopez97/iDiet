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

  // Clear error messages
  $(".errorBox").css("display", "none");

  // Remove and disable buttons on Start screen
  $("#login-btn").unbind("click");
  $(".button-container").fadeOut(500);

  // Reveal login screen
  $(".logo").animate({"top": "50%"}, 600);
  $(".form-holder").css("display", "block");
  $(".start-page-holder").animate({"height": "30%"},
    600,
    function(){
      $(".back").click(hideLogin);
    });
}

function hideLogin()
{
  console.log("hide login");

  // Disable back button on Login screen
  $(".back").unbind("click");

  // Reveal Start screen buttons
  $(".button-container").fadeIn(500);

  // Hide login screen
  $(".logo").animate({"top": "35%"}, 600);
  $(".form-holder").css("display", "block");
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