function isOccupate(aCinemaHallData, aRow, aSeat)
{
  var occupied = aCinemaHallData.occupiedPlaces;
  for(var i = 0; i < occupied.length; i++)
  {
    var obj = occupied[i];
    if(((obj.row - 1) == aRow) && (obj.seat == aSeat))
    {
      return true;
    }
  }
  return false;
}  

var gCinemaHallData;

function FillMovieSessionHall(aCinemaHallData)
{
  gCinemaHallData = aCinemaHallData;

  var cinemaHallMap = '';
  $.each(aCinemaHallData.row, function(row, numberOfSeats) {
    var seatType;
    
    cinemaHallRow = '';  
    for (i = 1; i <= numberOfSeats; i++) 
    {
      if (isOccupate(aCinemaHallData, row, i))
      {
        seatType = "occupate_seat";
      }
      else 
      {
        seatType = "seat";
      }

      // собираем ряды
      cinemaHallRow += '<div class="' + seatType + '" data-row="' + (row + 1) + '" data-seat="' +  i + '">&nbsp;</div>';
    }

    //собираем зал с проходами между рядами
    cinemaHallMap += '<div id="roomRow" style="white-space: nowrap;">' + cinemaHallRow + '</div>' + '<div class="passageBetween">&nbsp;</div>';
  });
  
  //заполняем в html зал номер 1
  $('.zal1').html(cinemaHallMap);

  var roomRect = room.getBoundingClientRect();
  var lastSeatRight = roomRow[0].lastChild.getBoundingClientRect().right;
  var roomScale = roomRect.width / (lastSeatRight - roomRect.left);
  if (roomScale < 1){ 
    room.style.scale = roomScale;  
    var roomRectNew = room.getBoundingClientRect();
    var leftDif = roomRect.left - roomRectNew.left;
    var topDif = roomRect.top - roomRectNew.top;
    room.style.left = leftDif + 'px';
    room.style.top = topDif + 'px';
  }  

  // тут по клику определяем что место выкуплено
  $('.seat').on('click', function(e) {
    // если первый раз кликнули билет выкупили, 
    // если повторно значит вернули билет
    $(e.currentTarget).toggleClass('bay');
    //показываем сколько билетов выкуплено
    showBaySeat();
  });  
}

function LoadMovieSessionHall(aMovieSessionId)
{
    var url = `/MovieSessionHall/${aMovieSessionId}`;
    fetch(url)
      .then(res => res.json())
      .then(aCinemaHallData => FillMovieSessionHall(aCinemaHallData))
      .catch(err => console.log(err));   
}

function showBaySeat() {
  var result = '';
  var seatCount = 0;

  //ищем все места купленные и показываем список выкупленных мест
  $.each($('.seat.bay'), function(key, item) {
    result += '<div class="ticket">Ряд: ' +
      $(item).data().row + ' Место:' +
      $(item).data().seat + '</div>';
    seatCount++;  
  });

  $('.result').html(result);
  document.getElementById('amount').innerHTML = seatCount;
  document.getElementById('cost').innerHTML = seatCount * gCinemaHallData.ticketPrice;
}

function CalcTickets()
{
  result = '';  
  $.each($('.seat.bay'), function(key, item) {
    if(result != '')
    {
      result += ',';
    }    
    result += '{"row": ' + $(item).data().row + ', "seat": ' + $(item).data().seat + '}';
  });
  
  if(result=='')
  {
    alert("Выбирете место")
  }

  result = '[' + result + ']';
  tickets.value = result;
}