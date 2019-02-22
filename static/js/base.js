$(document).ready(function() {

  /* Event handler for showing sidebar */
  $(".sidebar-mobile-icon-holder").click(displaySidebar);

  /* Hide sidebar when user clicks away */
  $("div.unfocused").click(function(e){
    hideSidebar();
  });
  $(".navbar, .navbar-list, .side, .navbtn, div.side.sidebar").click(function(e){e.stopPropagation();});
});