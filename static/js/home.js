$(document).ready(function(){
  $(window).resize(function(){
    fixHeights();
  });
  setInterval(function(){
    fixHeights();
  }, 500);
  populateMealPlan();
  function populateMealPlan(anim=null)
  {
    if (anim === null)
      anim = addLoader();
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
    getMeals(dindex, formattedDates, 0, $("#email").val(), ()=>{removeLoader(anim)});
  }

  function getMeals(dindex, formattedDates, current, email, callback)
  {
    if (dindex.length === 0 || current >= dindex.length)
      return callback();
    else
    {
      let link = "/api/meals?email=" + email + "&day=" + dindex[current];
      $.get(link, function(resp){
        if (resp.result === "error" || resp.data.length === 0)
        {
          return generateMealPlan(email, callback);
        }
        else
        {
          addToHomepage(resp.data, formattedDates[current], dindex[current],function(){
            getMeals(dindex, formattedDates,current+1, email, callback);
          });
        }
      });
    }
  }

  function generateMealPlan(email, callback)
  {
    let animation = addLoader();
    $.get("/api/create/meals?email=" + email, function(data){
      console.log(data);
      populateMealPlan(animation);
      callback();
    });
  }

  function addLoader()
  {
    if ($(".loader").length === 0)
    {
      $(".meals").append(`
      <div class="loader">
        <div class="lds-circle"><div></div></div><br>
        <div class="loader-text">CREATING MEAL PLAN<span id="lds-el">...</span></div>
      </div>
    `);
      return setInterval(()=>{
        let ell = $("#lds-el")[0];
        if ( ell.innerHTML.length > 3 )
          ell.innerHTML = "";
        else
          ell.innerHTML += ".";
      },200);
    }
    else
    {
      console.log("loader already exists");
    }
  }

  function removeLoader(animation)
  {
    $(".loader").remove();
    clearInterval(animation);
  }

  function addToHomepage(data, date_title, current, callback)
  {
    let row = $(`<h5 class="date-title">${date_title}</h5><div id='meal${current}' class='meal-row'></div>`);
    if ($(".loader").length === 0)
      $(".meals").append(row);
    else
      row.insertBefore(".loader");
    let mealEntries = "";
    for (let i = 0; i < 3; i++) {
      if (data[i].imagelink === "undefined")
      {
        data[i].imagelink = "/img/default.png";
      }
      mealEntries += `
              <div class="meal-wrapper">
                  <div class="meal-holder" onclick="location.href='${data[i].slink}';">
                      <img class="thumbnail" src="${data[i].imagelink}">
                      <div class="meal-caption">
                          <div class="meal-title">${data[i].title}</div>
                          <div class="meal-info">
                              <div id="calories"><b>Calories:</b> ${data[i].calories}</div>
                              <div id="protein"><b>Protein:</b> ${data[i].protein}g</div>
                              <div id="calories"><b>Fat:</b> ${data[i].fats}g</div>
                              <div id="cost">${data[i].price}</div>
                          </div>
                      </div>
                  </div>
              </div>
      `;
    }
    $(`#meal${current}`).append(mealEntries).append(function(){setHeight($(this));});
    callback();
  }

  function fixHeights()
  {
    for (let row of $(".meal-row"))
    {
      setHeight($(row));
    }
  }

  function setHeight(row)
  {
    let h = 0;
    for (let mh of row.find(".meal-holder"))
    {
      let hc = $(mh).outerHeight();
      if (hc > h)
        h = hc;
    }
    row.height(h + 30);
  }
});