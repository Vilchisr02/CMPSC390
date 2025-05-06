// 🌐 Fetch Dashboard Stats
const authToken = localStorage.getItem('authToken');

if (!authToken) {
  console.error('No authentication token found');
  window.location.href = '/index.html';
}

fetch('/seller/dashboard', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
})
.then(data => {
  if (data.success) {
    updateDashboard(data.sellerData);
  } else {
    console.error('Dashboard Error:', data.message);
    // Show user-friendly error message
    alert('Failed to load dashboard: ' + (data.message || 'Unknown error'));
  }
})
.catch(error => {
  console.error('Dashboard fetch error:', error);
  // Handle specific error cases
  if (error.message.includes('401')) {
    alert('Session expired. Please log in again.');
    window.location.href = '/index.html';
  } else {
    alert('Failed to load dashboard data. Please try again later.');
  }
});

function updateDashboard(sellerData) {
document.getElementById("earnings-amount").textContent = `$${parseFloat(sellerData.earnings).toFixed(2)}`;
document.getElementById("deductions-amount").textContent = `$${parseFloat(sellerData.deductions).toFixed(2)}`;
document.getElementById("seller-welcome").textContent = `Welcome, ${sellerData.name}!`;

//Earnings
const ctx = document.getElementById("earningsChart")?.getContext("2d");
if (ctx) {
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Earnings", "Deductions"],
      datasets: [
        {
          data: [sellerData.earnings, sellerData.deductions],
          backgroundColor: ["#4CAF50", "#F44336"],
        },
      ],
    },
  });
}
}

// 📊 Weekly Orders Chart
fetch('/seller/weekly-orders', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
})
.then(data => {
  if (!data.success) {
    console.error('Server reported error:', data.message);
    alert('Error: ' + (data.message || 'Unknown error'));
    return;
  }

  const formattedData = data.weeklyOrders.map(entry => {
    const date = new Date(entry.day);
    return {
      ...entry,
      displayDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      }),
      dateObj: date
    };
  });

  formattedData.sort((a, b) => a.dateObj - b.dateObj);

  console.log('Formatted dates:', formattedData);

  const ctx = document.getElementById("weeklyOrdersChart")?.getContext("2d");
  if (!ctx) {
    console.error('Could not find chart canvas');
    return;
  }

  if (window.weeklyOrdersChart instanceof Chart) {
    window.weeklyOrdersChart.destroy();
  }

  // Create new chart with dates
  window.weeklyOrdersChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: formattedData.map(entry => entry.displayDate),
      datasets: [{
        label: "Orders",
        data: formattedData.map(entry => entry.total_orders),
        backgroundColor: "#2196F3",
        borderColor: "#0d47a1",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Orders by Date',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Orders: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          },
          title: {
            display: true,
            text: 'Number of Orders'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
})
.catch(error => {
  console.error("Weekly Orders fetch error:", error);
  alert('Failed to load orders by date. Check console for details.');
});

// 📦 Orders Section
document.getElementById("btn-orders").addEventListener("click", () => {
  hideAllSections();
  document.getElementById("orders-section").style.display = "block";
  
  fetch('/seller/orders', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.getElementById("orders-list");
    container.innerHTML = "";
    
    if (data.success && Array.isArray(data.orders)) {
      if (data.orders.length === 0) {
        container.innerHTML = "<p>No orders found</p>";
      } else {
        data.orders.forEach(order => {
          // Safely handle numeric values
          const totalPrice = Number(order.TotalPrice) || 0;
          const orderDate = order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : 'N/A';
          
          container.innerHTML += `
            <div class="order-item">
              <p><strong>Order #${order.Transactionid || 'N/A'}</strong></p>
              <p>Date: ${orderDate}</p>
              <p>Total: $${totalPrice.toFixed(2)}</p>
              <p>Status: ${order.Status || 'Unknown'}</p>
              <p>Customer: ${order.CustomerFirstName || ''} ${order.CustomerLastName || ''}</p>
            </div>`;
        });
      }
    } else {
      console.error('Invalid orders data:', data);
      container.innerHTML = "<p>Error loading orders</p>";
    }
  })
  .catch(error => {
    console.error("Orders fetch error:", error);
    document.getElementById("orders-list").innerHTML = 
      "<p>Error loading orders. Please try again.</p>";
  });
});

// 🛒 Products Section
document.getElementById("btn-products").addEventListener("click", () => {
  hideAllSections();
  document.getElementById("products-section").style.display = "block";
  
  fetch('/seller/products', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.getElementById("products-list");
    container.innerHTML = "";
    
    if (data.success && Array.isArray(data.products)) {
      if (data.products.length === 0) {
        container.innerHTML = "<p>No products found</p>";
      } else {
        data.products.forEach(product => {
          container.innerHTML += `
            <div class="product-item">
              <p><strong>${product.Name}</strong></p>
              <p>Stock: ${product.StockQuantity || 0}</p>
              <p>Price: $${(product.Price || 0).toFixed(2)}</p>
            </div>`;
        });
      }
    } else {
      console.error('Invalid products data:', data);
      container.innerHTML = "<p>Error loading products</p>";
    }
  })
  .catch(error => {
    console.error("Products fetch error:", error);
    document.getElementById("products-list").innerHTML = 
      "<p>Error loading products. Please try again.</p>";
  });
});

// 👥 Customer Reviews - Updated with auth token and proper response handling
document.getElementById("btn-reviews").addEventListener("click", () => {
  hideAllSections();
  document.getElementById("customers-section").style.display = "block";
  
  fetch('/seller/reviews', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.getElementById("customers-list");
    container.innerHTML = "";
    
    if (data.success && Array.isArray(data.reviews)) {
      data.reviews.forEach(review => {
        container.innerHTML += `
          <div class="review-item">
            <p><strong>${review.Username}</strong> reviewed <strong>${review.ProductName}</strong>:</p>
            <p>${review.Comment}</p>
            <p>Rating: ${"⭐".repeat(review.Rating)}</p>
          </div>`;
      });
    } else {
      console.error('Invalid reviews data:', data);
      container.innerHTML = "<p>No reviews found or error loading reviews.</p>";
    }
  })
  .catch(error => {
    console.error("Reviews fetch error:", error);
    document.getElementById("customers-list").innerHTML = "<p>Error loading reviews. Please try again.</p>";
  });
});

// 🌙 Dark Mode
const toggleDark = document.getElementById("toggle-dark");
if (toggleDark) {
toggleDark.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
}

// Utility: Hide all sections
function hideAllSections() {
document.getElementById("orders-section").style.display = "none";
document.getElementById("products-section").style.display = "none";
document.getElementById("customers-section").style.display = "none";
}
