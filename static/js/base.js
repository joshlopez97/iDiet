$(document).ready(function() {
  /* Resize elements based on viewport size */
  $(window).resize(function() {
    if (document.documentElement.clientWidth <= 975) {
      if ($(".sidebar").length > 0)
        hideSidebar();
    }
  });

  /* Event handler for showing sidebar */
  $(".sidebar-mobile-icon-holder").click(displaySidebar);

  /* Hide sidebar when user clicks away */
  $("body").click(function(e){
    if (!$(e.target).hasClass('side'))
      hideSidebar();
  });
  $(".navbar, .navbar-list, .side, .navbtn, div.side.sidebar").click(function(e){e.stopPropagation();});
});