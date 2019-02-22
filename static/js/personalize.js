$(document).ready(function(){
  $(".back-btn").click(function () {
    window.location.href = "/signup"
  });
  $("#budget").on("input", function(){
    const value = $(this).val(),
      lastValue = $(this).data("lastVal");

    // Allow user to backspace without autoformatting
    if (lastValue && lastValue.length > value.length)
    {
      $(this).data("lastVal", $(this).val());
      return;
    }

    const moneyRegex = /^\$?([0-9]+\.?[0-9]{0,2})$/;

    // Change "5" to "5 '" automatically
    if (value.match(/^[0-9]+$/))
    {
      $(this).val("$"+value);
    }
    // Changes "62", "6 2", "6'2", ... all to "6 ' 2"
    else if (value.match(moneyRegex))
    {
      $(this).val("$"+moneyRegex.exec(value)[1]);
    }
    // Revert to last recorded value if input is invalid
    else
    {
      $(this).val(lastValue? lastValue : "");
    }
    $(this).data("lastVal", $(this).val());
  })
    .change(function(){
      const moneyRegex = /^\$?([0-9]+\.?[0-9]{0,2})$/,
        value      = $(this).val();
      if (value.match(moneyRegex)) {
        $(this).val("$" + Number.parseFloat(moneyRegex.exec(value)[1]).toFixed(2))
      }
    });
});