// Shared slot picker. Used by the landing page (step 2) and book.html (SMS/email link).
window.mountBooking = function (el, leadId, key, onDone) {
  var tz = 'America/New_York', picked = null;
  var fmtDay = function (iso) { return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso)); };
  var fmtTime = function (iso) { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso)); };
  el.textContent = 'Loading times…';
  fetch('/api/availability').then(function (r) { return r.json(); }).then(function (a) {
    tz = a.timezone || tz;
    if (!a.days.length) { el.innerHTML = '<p class="sub">No online slots right now. We will call you to schedule.</p>'; return; }
    el.innerHTML = '';
    var addr = document.createElement('input'); addr.placeholder = 'Property address'; addr.autocomplete = 'street-address'; addr.setAttribute('aria-label', 'Property address');
    var note = document.createElement('p'); note.className = 'sub';
    note.textContent = 'Your estimator will audio-record the visit (measurements and your preferences) only with your OK at the door. You can say no and we will take notes by hand.';
    var msg = document.createElement('p'); msg.className = 'err'; msg.setAttribute('role', 'alert');
    var ok = document.createElement('button'); ok.className = 'btn'; ok.textContent = 'Confirm my free estimate'; ok.disabled = true; ok.style.width = '100%';
    a.days.forEach(function (d) {
      var h = document.createElement('div'); h.className = 'sub'; h.style.margin = '12px 0 0'; h.textContent = fmtDay(d.slots[0]);
      var wrap = document.createElement('div'); wrap.className = 'slots';
      d.slots.forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = fmtTime(s);
        b.onclick = function () { picked = s; el.querySelectorAll('.slots button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); ok.disabled = false; };
        wrap.appendChild(b);
      });
      el.appendChild(h); el.appendChild(wrap);
    });
    el.appendChild(addr); el.appendChild(note); el.appendChild(msg); el.appendChild(ok);
    ok.onclick = function () {
      msg.textContent = ''; ok.disabled = true;
      fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: leadId, key: key, start: picked, address: addr.value }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) { msg.textContent = x.j.error || 'Could not book that time.'; ok.disabled = false; return; }
          el.innerHTML = '<h3>You are booked ✓</h3><p class="sub">' + fmtDay(picked) + ' at ' + fmtTime(picked) + '. We just texted/emailed a confirmation.</p>';
          if (onDone) onDone();
        }).catch(function () { msg.textContent = 'Network error. Please try again.'; ok.disabled = false; });
    };
  }).catch(function () { el.textContent = 'Could not load times. We will call you to schedule.'; });
};
