$(document).ready(function() {
  $(".back-btn").click(function () {
    window.location.href = "/start"
  });
  $("#height").on("input", function() {
    const value = $(this).val(),
      lastValue = $(this).data("lastVal");

    // Allow user to backspace without autoformatting
    if (lastValue && lastValue.length > value.length)
    {
      $(this).data("lastVal", $(this).val());
      return;
    }

    const heightRegex = /^([1-9]) ?'? ?([0-9]| ?1[01])$/g;

    // Change "5" to "5 '" automatically
    if (value.match(/^[1-9] *$/))
    {
      $(this).val(value.charAt(0) + ' \' ');
    }
    // Changes "62", "6 2", "6'2", ... all to "6 ' 2"
    else if (value.match(heightRegex))
    {
      const matches = heightRegex.exec(value),
        feet    = matches[1],
        inches  = matches[2];
      $(this).val(feet + ' \' ' + inches);
    }
    // Revert to last recorded value if input is invalid
    else
    {
      $(this).val(lastValue? lastValue : "");
    }
    $(this).data("lastVal", $(this).val());
  });
});