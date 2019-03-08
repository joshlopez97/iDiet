$(document).ready(function(){

  // Ensure heights of rows are resized even if elements load slowly
  $(window).resize(function(){
    fixHeights();
  });
  setInterval(function(){
    fixHeights();
  }, 500);


  populateMealPlan();
  function populateMealPlan(anim=null)
  {
    const email = $("#email").val();
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
    getMeals(dindex, formattedDates, 0, email, function(){
      removeLoader(anim);
      $(".like-icon-holder").click(function(){
        const icon = $(this).find(".like-icon");
        icon.attr("src", "/img/like-pressed.png");

        let meal_info = $(this).attr("id").match(/([0-9]+)/);
        $.get(`/api/like?email=${email}&mid=${meal_info[0]}`, function(res){
          console.log(res);
        });
      });
      $(".dislike-icon-holder").click(function(){
        let meal_info = $(this).attr("id").match(/([0-9]+)/g);
        $.get(`/api/dislike?email=${email}&mid=${meal_info[0]}&mindex=${meal_info[1]}`, function(res){
          console.log(res);
          replaceMeal($(`#mh-${meal_info[0]}-${meal_info[1]}`), res.data, meal_info[1]);
        });
      });
    });
  }

  function replaceMeal(element, newMealData, mindex)
  {
    console.log(newMealData);
    console.log(element.find(".thumbnail").length);
    element.find(".thumbnail").attr("src", newMealData.imagelink);
    element.find(".meal-title > a").text(newMealData.title).attr('href', newMealData.slink);
    element.find(".calories-value").text(newMealData.calories);
    element.find(".fat-value").text(newMealData.fats);
    element.find(".protein-value").text(newMealData.protein);
    element.find(".cost").text(newMealData.price);
    element.find(".like-icon-holder").attr("id", `like-${newMealData.mid}-${mindex}`);
    element.find(".dislike-icon-holder").attr("id", `dislike-${newMealData.mid}-${mindex}`);
    element.attr("id", `mh-${newMealData.mid}-${mindex}`);
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
                  <div id="mh-${data[i].mid}-${current}" class="meal-holder">
                      <img class="thumbnail" src="${data[i].imagelink}">
                      <div class="meal-caption">
                          <div class="meal-title"><a href="${data[i].slink}">${data[i].title}</a></div>
                          <div class="meal-info">
                              <div class="calories"><b>Calories:</b> <span class="calories-value">${data[i].calories}</span></div>
                              <div class="protein"><b>Protein:</b> <span class="protein-value">${data[i].protein}g</span></div>
                              <div class="fat"><b>Fat:</b> <span class="fat-value">${data[i].fats}g</span></div>
                              <div class="cost green-bold">${data[i].price}</div>
                          </div>
                      </div>
                      <div id="like-${data[i].mid}-${current}" class="like-icon-holder"><img class="like-icon" src="/img/like.png"></div>
                      <div id="dislike-${data[i].mid}-${current}" class="dislike-icon-holder"><img class="dislike-icon" src="/img/dislike.png"></div>
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