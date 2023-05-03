const { ipcRenderer } = require("electron");

// Get the search input and form
const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");

// Get the review input and form
const reviewInput = document.getElementById("review-input");
const reviewForm = document.getElementById("review-form");

// Get permission input and form
const permissionInput = document.getElementById("permission-input");
const permissionForm = document.getElementById("permission-form");

// Get data safety input and form
const dataSafetyInput = document.getElementById("data-safety-input");
const dataSafetyForm = document.getElementById("data-safety-form");

// Get similar apps input and form
const similarAppsInput = document.getElementById("similar-apps-input");
const similarAppsForm = document.getElementById("similar-apps-form");

// Get app details input and form
const appDetailsInput = document.getElementById("app-details-input");
const appDetailsForm = document.getElementById("app-details-form");

document.getElementById("backButton").onclick = function () {
  location.href = "../index.html";
};

// Function to generate CSV data from an array of objects
function generateCSVData(objects, fields) {
  let csvData = "";

  // Loop through each object and add it to the CSV data string
  csvData += fields.join(",") + "\n";
  for (const obj of objects) {
    const row = [];
    fields.forEach((field) => {
      if (field in obj) {
        if (typeof obj[field] === "string") {
          row.push(`"${obj[field].replace(/"/g, '""')}"`);
        } else {
          row.push(obj[field]);
        }
      } else {
        row.push("N/A");
      }
    });
    csvData += row.join(",") + "\n";
  }

  return csvData;
}

// Function to download a CSV file with the given data and filename
function downloadCSVFile(csvData, filename) {
  // Create a temporary link to download the CSV file
  const link = document.createElement("a");
  link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvData));
  // save to csvs folder
  link.setAttribute("download", filename);

  // Append the link to the document body and click it to download the CSV file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (searchInput && searchForm) {
  // Search form event listener
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const term = searchInput.value.trim();

    ipcRenderer.send("search", term);
  });
} 

if (reviewInput && reviewForm) {
  // Review form event listener
  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent form submission

    const appId = reviewInput.value.trim();

    if (!appId) {
      // do nothing if input is empty
      return;
    }

    ipcRenderer.send("get-reviews", appId);
  });
}

if (permissionInput && permissionForm) {
  // Permission form event listener
  permissionForm.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent form submission

    const appId = permissionInput.value.trim();

    if (!appId) {
      // do nothing if input is empty
      return;
    }

    ipcRenderer.send("get-app-permissions", appId);
  });
}

if (dataSafetyInput && dataSafetyForm) {
  // Data safety form event listener
  dataSafetyForm.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent form submission

    const appId = dataSafetyInput.value.trim();

    if (!appId) {
      // do nothing if input is empty
      return;
    }

    ipcRenderer.send("get-data-safety", appId);
  });
}

if (similarAppsInput && similarAppsForm) {
  // Similar apps form event listener
  similarAppsForm.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent form submission

    const appId = similarAppsInput.value.trim();

    if (!appId) {
      // do nothing if input is empty 
      return;
    }

    ipcRenderer.send("get-similar-apps", appId);
  });
}

if (appDetailsInput && appDetailsForm) {
  // App details form event listener
  appDetailsForm.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent form submission

    const appId = appDetailsInput.value.trim();

    if (!appId) {
      // do nothing if input is empty
      return;
    }

    ipcRenderer.send("get-app-details", appId);
  });
}

// Search results event listener
ipcRenderer.on("search-results", async (event, resultsData, term) => {
  console.log("Received search results for term:", term);

  let results;
  try {
    results = JSON.parse(resultsData);
  } catch (err) {
    console.error("Error parsing search results data:", err);
    return;
  }

  const fields = [ "url", "appId", "summary", "title", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free" ];

  const csvData = generateCSVData(results, fields);

  // Download the CSV file with the search results
  downloadCSVFile(csvData, `${term}-search.csv`);
});

// Review results event listener
ipcRenderer.on("reviews-results", async (event, paginatedReviews, appId) => {
  console.log("Received reviews for app:", appId);

  const fields = [ "id", "userName", "userImage", "score", "date", "score", "scoreText", "url", "text", "replyDate", "replyText", "version", "thumbsUp"];
  
  // if replyDate is null, N/A
    paginatedReviews.data.forEach((review) => {
      if (review.replyDate === null) {
        review.replyDate = "N/A";
      }

      if (review.replyText === null) {
        review.replyText = "N/A";
      }
    });

  const csvData = generateCSVData(paginatedReviews.data, fields);

  // Download the CSV file with the reviews
  downloadCSVFile(csvData, `${appId}-reviews.csv`);
}); 

// Permission results event listener
ipcRenderer.on("permission-results", async (event, permissions, appId) => {
  console.log("Received permissions for app:", appId);

  const fields = [ "permission", "type"];

  const csvData = generateCSVData(permissions, fields);

  // Download the CSV file with the permissions
  downloadCSVFile(csvData, `${appId}-permissions.csv`);
});

// Data safety results event listener
ipcRenderer.on("data-safety-results", async (event, dataSafety, appId) => {
  console.log("Received data safety:");

  const fields = [ "category","data","optional","purpose","type","securityPractices","privacyPolicyUrl" ];

  const sharedDataFormatted = dataSafety.sharedData.map((item) => {
    return {
      category: "shared data",
      data: item.data,
      optional: item.optional,
      purpose: item.purpose,
      type: item.type,
      securityPractices: dataSafety.securityPractices.map((practice) => `${practice.practice} (${practice.description})`).join("; "),
      privacyPolicyUrl: dataSafety.privacyPolicyUrl
    }
  });

  const collectedDataFormatted = dataSafety.collectedData.map((item) => {
    return {
      category: "collected data",
      data: item.data,
      optional: item.optional,
      purpose: item.purpose,
      type: item.type,
      securityPractices: dataSafety.securityPractices.map((practice) => `${practice.practice} (${practice.description})`).join("; "),
      privacyPolicyUrl: dataSafety.privacyPolicyUrl
    }
  });

  const dataSafetyFormatted = sharedDataFormatted.concat(collectedDataFormatted);

  const csvData = generateCSVData(dataSafetyFormatted, fields);

  // Download the CSV file with the data safety
  downloadCSVFile(csvData, `${appId}-dataSafety.csv`);
});

// Similar apps results event listener
ipcRenderer.on("similar-apps-results", async (event, similarApps, appId) => {
  console.log("Received similar apps for app:", appId);

  const fields = [ "url", "appId", "summary", "developer", "developerId", "icon", "score", "scoreText", "priceText", "free" ];

  const csvData = generateCSVData(similarApps, fields);

  // Download the CSV file with the similar apps
  downloadCSVFile(csvData, `${appId}-similarApps.csv`);
});

// App details results event listener
ipcRenderer.on("app-details-results", async (event, appDetails, appId) => {
  console.log("Received app details for app:", appId);

  // get all fields
  const fields = ["title","description","descriptionHTML","summary","installs","minInstalls","maxInstalls","score","scoreText","ratings","reviews","price","free","currency","priceText","available","offersIAP","IAPRange","androidVersion","androidVersionText","developer","developerId","developerEmail","developerWebsite","developerAddress","privacyPolicy","developerInternalID","genre","genreId","icon","headerImage","screenshots","contentRating","contentRatingDescription","adSupported","released","updated","version","recentChanges","appId","url"];

  // concatenate screenshot URLs with ;
  // check if screenshots property exists
  // concatenate screenshot urls with ;
  if (Array.isArray(appDetails.screenshots)) {
    const screenshots = appDetails.screenshots.join(",");
    appDetails.screenshots = screenshots;
  }  
  
  const csvData = generateCSVData([appDetails], fields);

  // Download the CSV file with the app details
  downloadCSVFile(csvData, `${appId}-appDetails.csv`);
});

// Search error event listener
ipcRenderer.on("search-error", (event, err) => {
  console.error("Error occurred during search:", err);
  // Show error message to user
});

// Review error
ipcRenderer.on("review-error", (event, err) => {
  console.error("Error occurred while getting reviews:", err);
  // Show error message to user
});

// Permission error
ipcRenderer.on("permission-error", (event, err) => {
  console.error("Error occurred while getting permissions:", err);
  // Show error message to user
});

// Data safety error
ipcRenderer.on("data-safety-error", (event, err) => {
  console.error("Error occurred while getting data safety:", err);
  // Show error message to user
});

// Similar apps error
ipcRenderer.on("similar-apps-error", (event, err) => {
  console.error("Error occurred while getting similar apps:", err);
  // Show error message to user
});

// App details error
ipcRenderer.on("app-details-error", (event, err) => {
  console.error("Error occurred while getting app details:", err);
  // Show error message to user
});