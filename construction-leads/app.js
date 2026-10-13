(function () {
  var cfg = window.SITE_CONFIG || {};
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    el.textContent = cfg[el.getAttribute("data-cfg")] || "";
  });
  document.getElementById("yr").textContent = new Date().getFullYear();
  document.getElementById("callLink").href = "tel:" + String(cfg.phone || "").replace(/[^\d+]/g, "");

  var form = document.getElementById("leadForm");
  var err = document.getElementById("err");
  var btn = document.getElementById("submitBtn");

  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) {
      if (p.get(k)) o[k] = p.get(k);
    });
    return o;
  }

  function showBooking(lead, res) {
    document.getElementById("step1").hidden = true;
    document.getElementById("step2").hidden = false;
    var box = document.getElementById("booking");
    if (res && res.leadId && window.mountBooking) {
      window.mountBooking(box, res.leadId, res.key);
    } else if (cfg.bookingUrl) {
      var u = new URL(cfg.bookingUrl);
      if (lead.name) u.searchParams.set("name", lead.name);
      if (lead.email) u.searchParams.set("email", lead.email);
      var f = document.createElement("iframe");
      f.src = u.toString();
      f.title = "Book your free estimate";
      box.appendChild(f);
    } else {
      box.innerHTML = '<p class="sub">Thanks! We will call you shortly to schedule your free estimate.</p>';
    }
    document.getElementById("formCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.textContent = "";
    var d = Object.fromEntries(new FormData(form).entries());
    if (d.website) return; // honeypot
    var digits = (d.phone || "").replace(/\D/g, "");
    if (!d.name || !d.service || !d.propertyType || !d.zip) { err.textContent = "Please fill in the required fields."; return; }
    if (digits.length < 10) { err.textContent = "Please enter a valid phone number."; return; }
    if (!form.consent.checked) { err.textContent = "Please accept the contact consent to continue."; return; }

    var lead = {
      name: d.name, phone: digits, email: d.email || "", zip: d.zip,
      service: d.service, propertyType: d.propertyType, timeline: d.timeline || "",
      details: d.details || "", consent: true, consentText: form.querySelector(".consent span").textContent.trim(),
      page: location.href, submittedAt: new Date().toISOString(), utm: utm()
    };

    btn.disabled = true; btn.textContent = "Sending…";
    var send = cfg.leadWebhookUrl
      ? fetch(cfg.leadWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) })
      : Promise.resolve({ ok: true });
    send.then(function (r) {
      if (!r.ok) throw new Error("bad status");
      return r.json ? r.json().catch(function () { return {}; }) : {};
    }).then(function (res) {
      showBooking(lead, res);
    }).catch(function () {
      err.textContent = "Something went wrong. Please call us at " + (cfg.phone || "") + ".";
      btn.disabled = false; btn.textContent = "Get my free estimate";
    });
  });
})();
