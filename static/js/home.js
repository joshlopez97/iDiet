function addFacebookShareBtns()
{
  let adder = window.setInterval(function() {
    const email = $("#email").val(),
          meals = $(".meal-wrapper");
    if (meals.length >= 21) {
      meals.each(function () {
        if ($(this).find(".fb-share-btn-holder").length === 0)
        {
          let mid = $(this).find(".meal-holder").attr("id").match(/\d+/);
          let url = encodeURI($(this).find(".meal-title > a").attr("href"));
          let sharelink = $(`
<div class="fb-share-btn-holder">
  <div class="fb-share-button" data-href="https://developers.facebook.com/docs/plugins/" data-layout="button" data-size="small"><a class="fb-share" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${url}" class="fb-xfbml-parse-ignore">Share</a></div>
</div>`);
          sharelink.click(function () {
            $.get(`/api/like?email=${email}&mid=${mid}`, function(res){
              console.log(res);
            });
          });
          $(this).find(".meal-info").append(sharelink);
        }
      });
      clearInterval(adder);
    }
  }, 100);
}

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
      // Remove loading animation
      removeLoader(anim);

      // Attach like/dislike event handlers
      $(".like-icon-holder").click(function(){
        const icon = $(this).find(".like-icon");
        icon.attr("src", "/img/like-pressed.png");

        let meal_info = $(this).attr("id").match(/([0-9]+)/);
        $.get(`/api/like?email=${email}&mid=${meal_info[0]}`, function(res){
          console.log(res);
        });
      });
      $(".dislike-icon-holder").click(function(){
        let meal_info = $(this).attr("id").match(/([0-9]+)/g),
            meal_holder = $(this).parent();
        meal_holder.css("display","none");

        addMealLoader(meal_holder.parent(), meal_info[0], meal_info[1]);

        $.get(`/api/dislike?email=${email}&mid=${meal_info[0]}&mindex=${meal_info[1]}`, function(res){
          console.log(res);
          replaceMeal(meal_holder, res.data, meal_info[0], meal_info[1]);
        });
      });

      // popup current meal
      setTimeout(function(){
        let hr = new Date().getHours(),
          meals = $(".meal-holder"),
          dtitle,
          meal;
        console.log(hr)
        if (hr >= 6 && hr <= 10)
        {
          dtitle = "It's Breakfast Time!";
          meal = $(meals[0]).clone();
        }
        else if (hr >= 12 && hr <= 15)
        {
          dtitle = "It's Lunch Time!";
          meal = $(meals[1]).clone();
        }
        else if (hr >= 17 && hr <= 21)
        {
          dtitle = "It's Dinner Time!";
          meal = $(meals[2]).clone();
        }
        else
          return;



        let dbox = $("#dialog");
        dbox.attr("title", dtitle);
        dbox.append(meal);
        dbox.dialog({"autoResize": true, "show": "fadeIn"});
        dbox.height(meal.outerHeight());
        $(".ui-dialog").css({"top": "50%", "left": "50%", "transform": "translate(-50%, -50%)"})
      }, 5000);
    });
  }

  function addMealLoader(elem, mid, mindex)
  {
    elem.append(`
      <div id="loader-${mid}-${mindex}" class="mini-loader">
        <div class="lds-circle"><div></div></div><br>
      </div>
    `);
  }

  function replaceMeal(element, newMealData, mid, mindex)
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
    $(`#loader-${mid}-${mindex}`).remove();
    element.css("display", "inline-block");

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
    $(".meals").css("top", $(".header-wrapper").outerHeight() + 50 + "px");
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