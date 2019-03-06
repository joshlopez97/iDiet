function onLoad()
{
  let action = $("#action").val();
  console.log(action);
  if (action !== "login") {
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
  let fh  = $(".form-holder"),
      logo = $(".logo");
  if (!fh.hasClass("shrink")) {
    console.log("show login");

    // Clear error messages
    $(".errorBox").css("display", "none");

    // Remove and disable buttons on Start screen
    $("#login-btn").unbind("click");
    $(".button-container").fadeOut(500);

    // Reveal login screen
    logo.removeClass("login-close");
    logo.addClass("login-open");

    fh.css('display', 'block');
    fh.removeClass("inactive");
    fh.addClass("active");
    $(".back").click(hideLogin);
  }
}

function hideLogin()
{
  let fh  = $(".form-holder"),
      logo = $(".logo");
  if (!fh.hasClass("grow")) {
    console.log("hide login");

    // Disable back button on Login screen
    $(".back").unbind("click");

    // Reveal Start screen buttons
    $(".button-container").fadeIn(500);

    // Hide login screen
    logo.removeClass("login-open");
    logo.removeClass("im");
    logo.addClass("login-close");
    setTimeout(function() {
      fh.css('display', 'none');
    }, 700);

    fh.removeClass("active");
    fh.removeClass("im");
    fh.addClass("inactive");
    $("#login-btn").click(showLogin);
  }

}

$(document).ready(function()
{
  setTimeout(onLoad, 700);
});