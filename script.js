$(document).ready(function() {
    $('#search-btn').on('click', function() {
      const location = $('#location-input').val();
      if (location.trim() !== '') {
        getGeocodeData(location)
          .then(({ lat, lon }) => {
            // Make API requests for both today and tomorrow
            const todayPromise = getSunriseSunsetData(lat, lon, new Date());
            const tomorrowPromise = getSunriseSunsetData(lat, lon, new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
  
            // Handle both promises
            Promise.all([todayPromise, tomorrowPromise])
              .then(([todayData, tomorrowData]) => updateDashboard(todayData, tomorrowData))
              .catch(error => showError(error));
          })
          .catch(error => showError(error));
      }
    });
  
    $('#current-location-btn').on('click', function() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const todayPromise = getSunriseSunsetData(position.coords.latitude, position.coords.longitude, new Date());
            const tomorrowPromise = getSunriseSunsetData(
              position.coords.latitude,
              position.coords.longitude,
              new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
            );
  
            Promise.all([todayPromise, tomorrowPromise])
              .then(([todayData, tomorrowData]) => updateDashboard(todayData, tomorrowData))
              .catch(error => showError(error));
          },
          error => showError(`Geolocation error: ${error.message}`)
        );
      } else {
        showError('Geolocation is not supported by your browser.');
      }
    });
  });
  
  function getGeocodeData(location) {
  const geocodeAPI = `https://geocode.maps.co/search?q=${encodeURIComponent(location)}`;

  return $.ajax({
    url: geocodeAPI,
    method: 'GET',
    dataType: 'json'
  })
  .then(response => {
    if (response.error) {
      throw new Error(`Geocode API Error: ${response.error}`);
    }

    const results = response;

    if (!results || results.length === 0) {
      throw new Error(`No results found for the location: ${location}`);
    }

    const coordinates = {
      lat: results[0].lat,
      lon: results[0].lon
    };

    return coordinates;
  });
}

  
  // Helper function to find coordinates in nested structures
  function findCoordinates(result) {
    if (result.lat && result.lon) {
      return { lat: result.lat, lon: result.lon };
    }
  
    for (const key in result) {
      if (typeof result[key] === 'object') {
        const coordinates = findCoordinates(result[key]);
        if (coordinates) {
          return coordinates;
        }
      }
    }
  
    return null;
  }
  
  
  function getSunriseSunsetData(latitude, longitude, date) {
    // Format the date as "YYYY-MM-DD"
    const formattedDate = date.toISOString().split('T')[0];
  
    const sunriseAPI = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${formattedDate}`;
  
    return $.ajax({
      url: sunriseAPI,
      method: 'GET',
      dataType: 'json'
    })
    .then(response => {
      if (response.status !== 'OK') {
        throw new Error(`Sunrise Sunset API Error: ${response.status}`);
      }
  
      return response.results;
    });
  }
  
  function updateDashboard(todayData, tomorrowData) {
    $('#today-data').html(`
      <h2>TODAY</h2>

      <p><b>Sunrise:</b> ${todayData.sunrise}</p>
      <p><b>Sunset:</b> ${todayData.sunset}</p>
      <p><b>Dawn:</b> ${todayData.dawn}</p>
      <p><b>Dusk:</b> ${todayData.dusk}</p>
      <p><b>Day Length:</b> ${todayData.day_length}</p>
      <p><b>Solar Noon:</b> ${todayData.solar_noon}</p>
      <p><b>Time Zone:</b> ${todayData.timezone}</p>
    `);
  
    $('#tomorrow-data').html(`
      <h2>TOMORROW</h2>
      
      <p><b>Sunrise:</b> ${tomorrowData.sunrise}</p>
      <p><b>Sunset:</b> ${tomorrowData.sunset}</p>
      <p><b>Dawn:</b> ${tomorrowData.dawn}</p>
      <p><b>Dusk:</b> ${tomorrowData.dusk}</p>
      <p><b>Day Length:</b> ${tomorrowData.day_length}</p>
      <p><b>Solar Noon:</b> ${tomorrowData.solar_noon}</p>
      <p><b>Time Zone:</b> ${tomorrowData.timezone}</p>
    `);
  
    // Display the dashboard and hide the error message
    $('#dashboard').removeClass('hidden');
    $('#error-message').addClass('hidden');
  }
  
  function showError(message) {
    // Display the error message and hide the dashboard
    $('#error-message').text(message).removeClass('hidden');
    $('#dashboard').addClass('hidden');
  }
  