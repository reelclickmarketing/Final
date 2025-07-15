// main.js
const form = document.getElementById("service-form");
const quoteBox = document.getElementById("quote-result");
const dropoffInput = document.getElementById("dropoff");
const dropoffLabel = document.getElementById("dropoff-label");
const serviceSelector = document.getElementById("service");
const pickupInput = document.getElementById("pickup");

const HQ_ADDRESS = "5172 Beacon Dr, Irondale, AL 35210";

let map;
let pickupLocation = null;
let dropoffLocation = null;

function showQuote(message) {
  quoteBox.classList.remove("hidden");
  quoteBox.innerHTML = `<strong>${message}</strong>`;
}

function toggleDropoff(show) {
  dropoffInput.classList.toggle("hidden", !show);
  dropoffLabel.classList.toggle("hidden", !show);
}

serviceSelector.addEventListener("change", () => {
  toggleDropoff(serviceSelector.value === "tow");
});

document.getElementById("auto-fill").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });
      if (res.results[0]) {
        pickupInput.value = res.results[0].formatted_address;
      }
    },
    (err) => alert("Unable to get location. Please enter it manually.")
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const service = serviceSelector.value;
  const pickup = pickupInput.value.trim();
  const dropoff = dropoffInput.value.trim();

  if (!pickup) return alert("Please enter a pickup address.");

  try {
    const pickupLoc = await getLatLngFromAddress(pickup);
    const hqLoc = await getLatLngFromAddress(HQ_ADDRESS);
    const enrouteMiles = await getDistanceInMiles(hqLoc, pickupLoc);

    if (service === "tow") {
      if (!dropoff) return alert("Please enter a drop-off address.");
      const dropoffLoc = await getLatLngFromAddress(dropoff);
      const towMiles = await getDistanceInMiles(pickupLoc, dropoffLoc);
      const price = 140 + enrouteMiles * 2 + towMiles * 3;
      showQuote(`Estimated Towing Price: $${price.toFixed(2)} (Enroute + Tow Miles)`);
    } else {
      const price = 140 + enrouteMiles * 2;
      showQuote(`Estimated Price: $${price.toFixed(2)} (includes travel)`);
    }
  } catch (err) {
    alert("Error calculating distance. Please check addresses.");
    console.error(err);
  }
});

async function getLatLngFromAddress(address) {
  const geocoder = new google.maps.Geocoder();
  const res = await geocoder.geocode({ address });
  if (!res.results[0]) throw new Error("Address not found");
  return res.results[0].geometry.location;
}

async function getDistanceInMiles(origin, destination) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        if (status !== "OK") return reject("Distance matrix failed");
        const distText = response.rows[0].elements[0].distance.text;
        const miles = parseFloat(distText.replace(/[^\d.]/g, ""));
        resolve(miles);
      }
    );
  });
}
