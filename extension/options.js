const url = document.getElementById("url");
const token = document.getElementById("token");
const msg = document.getElementById("msg");
const save = document.getElementById("save");

chrome.storage.sync.get(["ecospend_url", "ecospend_token"], (st) => {
  url.value = st.ecospend_url || "http://127.0.0.1:8000";
  token.value = st.ecospend_token || "";
});

save.onclick = () => {
  chrome.storage.sync.set(
    { ecospend_url: url.value.trim(), ecospend_token: token.value.trim() },
    () => {
      msg.textContent = "Saved ✓";
      setTimeout(() => (msg.textContent = ""), 1500);
    }
  );
};
