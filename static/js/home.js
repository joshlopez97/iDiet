$(document).ready(function(){
  populateMealPlan();
  function populateMealPlan()
  {
    let dindex = [];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      formattedDates = [];
    for (let i = 0; i < 7; i++) {
      let d = new Date();
      d.setHours(24 * i, 0, 0, 0);
      dindex.push(d.getDay());
      if (i === 0)
        formattedDates.push("Today, " + d.toLocaleDateString("en-US"));
      else
        formattedDates.push(days[d.getDay()] + ", " + d.toLocaleDateString("en-US"));
    }
    getMeals(dindex, formattedDates, 0, $("#email").val(), ()=>{});
  }

  function getMeals(dindex, formattedDates, current, email, callback)
  {
    console.log(dindex.length);
    if (dindex.length === 0 || current >= dindex.length)
      return callback();
    else
    {
      let link = "/api/meals?email=" + email + "&day=" + dindex[current];
      console.log("GET '" + link + "'");
      $.get(link, function(resp){
        console.log(resp.data);
        addToHomepage(resp.data, formattedDates[current], dindex[current],function(){
          getMeals(dindex, formattedDates,current+1, email, callback);
        });
      });
    }
  }

  function addToHomepage(data, date_title, current, callback)
  {
    $(".meals").append(`<h5 class="date-title">${date_title}</h5><div id='meal${current}' class='meal-row'></div>`);
    for (let i = 0; i < 3; i++) {
      if (data[i].imagelink === "undefined")
      {
        data[i].imagelink = "/img/default.png";
      }
      $(`#meal${current}`)
        .append(`
              <div class="meal-wrapper">
                  <div class="meal-holder" onclick="location.href='${data[i].slink}';">
                      <img class="thumbnail" src="${data[i].imagelink}">
                      <div class="meal-caption">
                          <div class="meal-title">${data[i].title}</div>
                          <div class="meal-info">
                              <div id="calories"><b>Calories:</b> ${data[i].calories}</div>
                              <div id="cost"><b>Cost:</b> ${data[i].price}</div>
                          </div>
                      </div>
                  </div>
              </div>
      `);
    }
    callback();
  }
});