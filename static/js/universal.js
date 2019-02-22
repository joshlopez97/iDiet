/**
 * Helper function to focus an input field
 */
function focusField(elem) {
  window.setTimeout(function()
  {
    elem.focus();
  }, 0);
}

/**
 * Displays sidebar menu with sliding animation
 */
function displaySidebar()
{
  let icon = $(".icon");
  if (!icon.hasClass("close"))
  {
    $("div.unfocused").fadeIn(300);
    icon.addClass("close");
    $(".sidebar").animate({left: "0px"}, 300,
        function(){
          // Change button action to hide sidebar
          let sidebarIcon = $(".sidebar-mobile-icon-holder");
          sidebarIcon.unbind('click');
          sidebarIcon.click(hideSidebar);
        });
  }
}

/**
 * Hides sidebar menu with sliding animation
 */
function hideSidebar()
{
  let icon = $(".icon");
  if (icon.hasClass("close"))
  {
    $("div.unfocused").fadeOut(300);
    icon.removeClass("close");
    $(".sidebar").animate({left: "-325px"}, 300,
        function(){
          // Change button action to display sidebar
          let sidebarIcon = $(".sidebar-mobile-icon-holder");
          sidebarIcon.unbind('click');
          sidebarIcon.click(displaySidebar);
        });
  }
}