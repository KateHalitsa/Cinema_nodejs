var slideIndex = 0;
showSlides();

function showSlides() {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    
    for (i = 0; i < slides.length; i++) {
       slides[i].style.display = "none";  
    }
    slideIndex++;
    if (slideIndex > slides.length) {slideIndex = 1}
    slides[slideIndex-1].style.display = "block";  
   
    setTimeout(showSlides, 6000); // Change image every 2 seconds
}

/**/var image = document.getElementById('cine-film');
image.onfocus = function(){
   this.style.zInnex='-1';
   document.getElementById("cadr2").style.zInnex="15";
   document.getElementById("cadrs").style.zInnex="15";
   /*document.getElementById("cadrs").style.position="absolute";*/
   document.getElementById("cadrs").style.width= "500px";
  
}
var but1 =document.getElementById("but1")
var but2 =document.getElementById("but2")
var but3 =document.getElementById("but3")

but1.onclick=function (){
    document.getElementById("pic").src = document.getElementById("pic1").src;
    document.getElementById("pic").width= "500px";
    document.getElementById("pic").style.display = 'block';
}

but2.onclick=function (){
    document.getElementById("pic").src = document.getElementById("pic2").src;
    document.getElementById("pic").width= "500px";
    document.getElementById("pic").style.display = 'block';
}
but3.onclick=function (){
    document.getElementById("pic").src = document.getElementById("pic3").src;
    document.getElementById("pic").width= "500px";
    document.getElementById("pic").style.display = 'block';
}


var cinemaHall1 = {
    row: [10, 10, 10, 10, 10, 10]
  },
  cinemaHallMap = '';
$.each(cinemaHall1.row, function(row, numberOfSeats) {
  cinemaHallRow = '';
  for (i = 1; i <= numberOfSeats; i++) {
    // собираем ряды
    cinemaHallRow += '<div class="seat" data-row="' +
      i + '" data-seat="' +
      i + '">&nbsp;</div>';
  }
  //собираем зал с проходами между рядами
  cinemaHallMap += cinemaHallRow + '<div class="passageBetween">&nbsp;</div>';
});

//заполняем в html зал номер 1
$('.zal1').html(cinemaHallMap);
// тут по клику определяем что место выкуплено
$('.seat').on('click', function(e) {
  // если первый раз кликнули билет выкупили, 
  // если повторно значит вернули билет
  $(e.currentTarget).toggleClass('bay');
  //показываем сколько билетов выкуплено
  showBaySeat();
});

function showBaySeat() {
  result = '';
  //ищем все места купленные и показываем список выкупленных мест
  $.each($('.seat.bay'), function(key, item) {
    result += '<div class="ticket">Ряд: ' +
      $(item).data().row + ' Место:' +
      $(item).data().seat + '</div>';
  });

  $('.result').html(result);
}