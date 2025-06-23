// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDYIPLfPAuPUf7LC1ZtixGFeP_0S1hdsUM",
  authDomain: "billingpsmegastation-9d3f8.firebaseapp.com",
  databaseURL:
    "https://billingpsmegastation-9d3f8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "billingpsmegastation-9d3f8",
  storageBucket: "billingpsmegastation-9d3f8.appspot.com",
  messagingSenderId: "264269418270",
  appId: "1:264269418270:web:3f568d700970b1e305430f",
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Data Perangkat
const devices = [
  { id: "tv1", name: "TV 1 (PS3)", type: "ps3" },
  { id: "tv2", name: "TV 2 (PS3)", type: "ps3" },
  { id: "tv3", name: "TV 3 (PS3)", type: "ps3" },
  { id: "tv4", name: "TV 4 (PS3)", type: "ps3" },
  { id: "tv5", name: "TV 5 (PS3)", type: "ps3" },
  { id: "tv6", name: "TV 6 (PS3)", type: "ps3" },
  { id: "ps4", name: "PS4", type: "ps4" },
];

// Harga
const prices = {
  ps3: {
    30: 5000,
    60: 9000,
    90: 14000,
    120: 18000,
    150: 23000,
    180: 27000,
  },
  ps4: {
    30: 7000,
    60: 13000,
    90: 20000,
    120: 26000,
    150: 33000,
    180: 39000,
  },
};

// Variabel Global
let activeTimers = {};
let pausedDevices = [];
let psTransactions = [];
let foodTransactions = [];

// Format Rupiah
function formatRupiah(angka) {
  return "Rp" + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format Waktu
function formatTime(date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format Tanggal
function formatDate(date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Format Durasi
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

// Render Perangkat
function renderDevices() {
  const container = document.getElementById("devices");
  container.innerHTML = "";

  devices.forEach((device) => {
    const isActive = activeTimers[device.id];
    const isPaused = pausedDevices.includes(device.id);

    const deviceElement = document.createElement("div");
    deviceElement.className = "device";
    deviceElement.innerHTML = `
      <div class="device-header">
        <div class="device-name">${device.name}</div>
        <div class="device-status ${
          isActive
            ? isPaused
              ? "status-paused"
              : "status-active"
            : "status-inactive"
        }">
          ${isActive ? (isPaused ? "Dijeda" : "Aktif") : "Tidak Aktif"}
        </div>
      </div>
      <div class="timer-display" id="${device.id}-timer">00:00:00</div>
      <div class="device-controls">
        <select id="${device.id}-duration">
          <option value="30">30 Menit (${formatRupiah(
            prices[device.type][30]
          )})</option>
          <option value="60">1 Jam (${formatRupiah(
            prices[device.type][60]
          )})</option>
          <option value="90">1.5 Jam (${formatRupiah(
            prices[device.type][90]
          )})</option>
          <option value="120">2 Jam (${formatRupiah(
            prices[device.type][120]
          )})</option>
          <option value="150">2.5 Jam (${formatRupiah(
            prices[device.type][150]
          )})</option>
          <option value="180">3 Jam (${formatRupiah(
            prices[device.type][180]
          )})</option>
        </select>
        <button class="btn ${isActive ? "btn-danger" : "btn-success"}" 
            onclick="${
              isActive
                ? `stopDevice('${device.id}')`
                : `startDevice('${device.id}')`
            }">
          <i class="fas fa-${isActive ? "stop" : "play"}"></i> ${
      isActive ? "Stop" : "Mulai"
    }
        </button>
        <button class="btn ${isPaused ? "btn-info" : "btn-warning"}" 
            ${!isActive ? "disabled" : ""}
            onclick="${
              isPaused
                ? `resumeDevice('${device.id}')`
                : `pauseDevice('${device.id}')`
            }">
          <i class="fas fa-${isPaused ? "play" : "pause"}"></i> ${
      isPaused ? "Lanjut" : "Jeda"
    }
        </button>
        ${
          isActive
            ? `
        <button class="btn btn-warning" onclick="cancelDevice('${device.id}')">
          <i class="fas fa-times"></i> Cancel
        </button>
        `
            : ""
        }
      </div>
    `;
    container.appendChild(deviceElement);
  });
}

// Mulai Perangkat
function startDevice(deviceId) {
  const device = devices.find((d) => d.id === deviceId);
  if (!device || activeTimers[deviceId]) return;

  const durationSelect = document.getElementById(`${deviceId}-duration`);
  const durationMinutes = parseInt(durationSelect.value);
  const durationSeconds = durationMinutes * 60;

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  activeTimers[deviceId] = {
    startTime,
    endTime,
    duration: durationSeconds,
    selectedDuration: durationMinutes,
    interval: setInterval(() => updateTimer(deviceId), 1000),
  };

  renderDevices();
  updateStats();
}

// Update Timer
function updateTimer(deviceId) {
  const timer = activeTimers[deviceId];
  if (!timer) return;

  const now = new Date();
  const remaining = Math.max(0, Math.floor((timer.endTime - now) / 1000));

  if (remaining <= 0) {
    stopDevice(deviceId);
    return;
  }

  const hours = Math.floor(remaining / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((remaining % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  document.getElementById(
    `${deviceId}-timer`
  ).textContent = `${hours}:${minutes}:${seconds}`;
}

// Jeda Perangkat
function pauseDevice(deviceId) {
  if (!activeTimers[deviceId] || pausedDevices.includes(deviceId)) return;

  clearInterval(activeTimers[deviceId].interval);
  pausedDevices.push(deviceId);
  renderDevices();
}

// Lanjutkan Perangkat
function resumeDevice(deviceId) {
  if (!activeTimers[deviceId] || !pausedDevices.includes(deviceId)) return;

  const index = pausedDevices.indexOf(deviceId);
  if (index > -1) {
    pausedDevices.splice(index, 1);
  }

  activeTimers[deviceId].interval = setInterval(
    () => updateTimer(deviceId),
    1000
  );
  renderDevices();
}

// Jeda Semua Perangkat
function pauseAllDevices() {
  Object.keys(activeTimers).forEach((deviceId) => {
    if (!pausedDevices.includes(deviceId)) {
      pauseDevice(deviceId);
    }
  });
}

// Batalkan Semua Perangkat
function cancelAllDevices() {
  Object.keys(activeTimers).forEach((deviceId) => {
    clearInterval(activeTimers[deviceId].interval);
    delete activeTimers[deviceId];
  });

  pausedDevices = [];
  renderDevices();
  updateStats();
}

// Fungsi baru untuk cancel device
function cancelDevice(deviceId) {
  if (!activeTimers[deviceId]) return;

  const timer = activeTimers[deviceId];
  clearInterval(timer.interval);

  // Hapus dari pausedDevices jika ada
  const index = pausedDevices.indexOf(deviceId);
  if (index > -1) {
    pausedDevices.splice(index, 1);
  }

  // Hapus transaksi yang belum selesai dari array
  psTransactions = psTransactions.filter(
    (t) => t.deviceId !== deviceId || t.status !== "selesai"
  );

  delete activeTimers[deviceId];
  renderDevices();
  updateStats();
}

// Stop Perangkat
function stopDevice(deviceId) {
  if (!activeTimers[deviceId]) return;

  const timer = activeTimers[deviceId];
  clearInterval(timer.interval);

  const device = devices.find((d) => d.id === deviceId);
  const endTime = new Date();

  const transaction = {
    deviceId,
    deviceName: device.name,
    startTime: formatTime(timer.startTime),
    startDate: formatDate(timer.startTime),
    endTime: formatTime(endTime),
    duration: timer.duration,
    price: prices[device.type][timer.selectedDuration],
    status: "selesai",
  };

  psTransactions.push(transaction);
  savePsTransaction(transaction);

  delete activeTimers[deviceId];
  renderDevices();
  updateStats();
  loadPsHistory();
}

// Simpan Transaksi PS ke Firebase
function savePsTransaction(transaction) {
  database.ref(`psTransactions/${transaction.deviceId}`).push(transaction);
}

// Simpan Transaksi Makanan ke Firebase
function saveFoodTransaction(transaction) {
  database.ref("foodTransactions").push(transaction);
}

// Muat Riwayat PS dari Firebase
function loadPsHistory() {
  const historyContent = document.getElementById("ps-history-content");
  historyContent.innerHTML = "";

  database.ref("psTransactions").once("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Buat container untuk setiap perangkat
    devices.forEach((device) => {
      const deviceHistory = document.createElement("div");
      deviceHistory.className = "device-history";

      const header = document.createElement("h3");
      header.textContent = `${device.name} - Riwayat Transaksi`;
      deviceHistory.appendChild(header);

      if (data[device.id]) {
        const transactions = Object.keys(data[device.id])
          .map((key) => ({
            id: key,
            ...data[device.id][key],
          }))
          .sort(
            (a, b) =>
              new Date(b.startDate + " " + b.startTime) -
              new Date(a.startDate + " " + a.startTime)
          );

        if (transactions.length > 0) {
          const table = document.createElement("table");
          table.innerHTML = `
            <thead>
              <tr>
                <th>No</th>
                <th>Waktu</th>
                <th>Durasi</th>
                <th>Harga</th>
              </tr>
            </thead>
            <tbody></tbody>
          `;

          const tbody = table.querySelector("tbody");
          transactions.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${index + 1}</td>
              <td>${item.startDate} ${item.startTime} - ${item.endTime}</td>
              <td>${formatDuration(item.duration)}</td>
              <td>${formatRupiah(item.price)}</td>
            `;
            tbody.appendChild(row);
          });

          deviceHistory.appendChild(table);
        } else {
          deviceHistory.innerHTML += "<p>Belum ada transaksi</p>";
        }
      } else {
        deviceHistory.innerHTML += "<p>Belum ada transaksi</p>";
      }

      historyContent.appendChild(deviceHistory);
    });
  });
}

// Muat Riwayat Makanan dari Firebase
function loadFoodHistory() {
  database.ref("foodTransactions").once("value", (snapshot) => {
    const data = snapshot.val();
    const historyTable = document
      .getElementById("food-history-table")
      .querySelector("tbody");
    historyTable.innerHTML = "";

    if (!data) {
      historyTable.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center;">Belum ada transaksi</td>
        </tr>
      `;
      return;
    }

    let count = 1;
    const transactions = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .sort(
        (a, b) =>
          new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time)
      );

    transactions.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${count++}</td>
        <td>${item.name}</td>
        <td>${formatRupiah(item.price)}</td>
        <td>${item.date} ${item.time}</td>
        <td>
          <button class="action-btn" onclick="deleteFoodTransaction('${
            item.id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      historyTable.appendChild(row);
    });
  });
}

// Hapus Transaksi Makanan
function deleteFoodTransaction(key) {
  database
    .ref(`foodTransactions/${key}`)
    .remove()
    .then(() => loadFoodHistory());
}

// Update Statistik
function updateStats() {
  const activeSessions = Object.keys(activeTimers).length;

  database.ref("psTransactions").once("value", (snapshot) => {
    const psData = snapshot.val();
    let totalIncome = 0;

    if (psData) {
      for (const deviceId in psData) {
        for (const transactionId in psData[deviceId]) {
          totalIncome += psData[deviceId][transactionId].price;
        }
      }
    }

    database.ref("foodTransactions").once("value", (foodSnapshot) => {
      const foodData = foodSnapshot.val();

      if (foodData) {
        for (const transactionId in foodData) {
          totalIncome += foodData[transactionId].price;
        }
      }

      document.getElementById("active-sessions").textContent = activeSessions;
      document.getElementById("total-income").textContent =
        formatRupiah(totalIncome);
    });
  });
}

// Tambahkan Pesanan Makanan/Minuman
function addOrder(name, price, type) {
  const now = new Date();
  const transaction = {
    name,
    price,
    type,
    date: formatDate(now),
    time: formatTime(now),
  };

  foodTransactions.push(transaction);
  saveFoodTransaction(transaction);
  loadFoodHistory();
  updateStats();
}

// Toggle Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark-mode")
  );

  const themeBtn = document.getElementById("theme-toggle");
  themeBtn.innerHTML = document.body.classList.contains("dark-mode")
    ? '<i class="fas fa-sun"></i> Mode Terang'
    : '<i class="fas fa-moon"></i> Mode Gelap';
}

// Toggle Tab
function toggleTab(tabId) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
  document
    .querySelector(`.tab-btn[data-tab="${tabId}"]`)
    .classList.add("active");
}

// Reset All History
function resetAllHistory() {
  database
    .ref("psTransactions")
    .remove()
    .then(() => {
      database
        .ref("foodTransactions")
        .remove()
        .then(() => {
          loadPsHistory();
          loadFoodHistory();
          updateStats();
        });
    });
}

// Inisialisasi
function init() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    document.getElementById("theme-toggle").innerHTML =
      '<i class="fas fa-sun"></i> Mode Terang';
  }

  // Event Listeners
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleDarkMode);
  document
    .getElementById("pause-all")
    .addEventListener("click", pauseAllDevices);
  document
    .getElementById("reset-history")
    .addEventListener("click", resetAllHistory);

  // Tab listeners
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      toggleTab(tabId);
    });
  });

  // Menu items
  document.querySelectorAll(".menu-item .btn-add").forEach((btn) => {
    btn.addEventListener("click", function () {
      const menuItem = this.closest(".menu-item");
      const name = menuItem.querySelector("span:first-child").textContent;
      const price = parseInt(menuItem.dataset.price);
      const type = menuItem.dataset.type;

      addOrder(name, price, type);
    });
  });

  // Render perangkat dan muat riwayat
  renderDevices();
  loadPsHistory();
  loadFoodHistory();
  updateStats();
}

// Jalankan saat halaman dimuat
document.addEventListener("DOMContentLoaded", init);
