$(document).ready(function() {

  /* Event handler for showing sidebar */
  $(".sidebar-mobile-icon-holder").click(displaySidebar);

  /* Hide sidebar when user clicks away */
  $("body").click(function(e){
    if (!$(e.target).hasClass('side'))
      hideSidebar();
  });
  $(".navbar, .navbar-list, .side, .navbtn, div.side.sidebar").click(function(e){e.stopPropagation();});
});