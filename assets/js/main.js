(function () {
  var body = document.body;
  var header = document.querySelector("[data-header]");
  var nav = document.querySelector("[data-nav]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var page = body ? body.getAttribute("data-page") : "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileLike = window.matchMedia("(max-width: 760px)").matches || window.matchMedia("(pointer: coarse)").matches;

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 18);
  }

  function setActiveNav() {
    var links = document.querySelectorAll("[data-nav-link]");
    var parentDropdown = null;
    links.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var target = href.replace(".html", "").replace("index", "home");
      if (target === page) {
        link.setAttribute("aria-current", "page");
        // Highlight parent dropdown if inside one
        var dropdown = link.closest(".nav-dropdown");
        if (dropdown) {
          var toggle = dropdown.querySelector(".nav-dropdown-toggle");
          if (toggle) toggle.setAttribute("aria-current", "page");
        }
      }
    });
  }

  function initNavigation() {
    if (!navToggle || !nav) return;
    navToggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    nav.addEventListener("click", function (event) {
      // Handle dropdown toggles
      var toggle = event.target.closest(".nav-dropdown-toggle");
      if (toggle) {
        // Prevent default only if it's a click to toggle, but for standard desktop we might want it to go to hub.
        // If mobileLike is true, toggle the dropdown.
        if (mobileLike) {
          event.preventDefault();
          var dropdown = toggle.closest(".nav-dropdown");
          dropdown.classList.toggle("active");
          return;
        }
      }

      if (event.target.tagName === "A" && !event.target.classList.contains("nav-dropdown-toggle")) {
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation");
      }
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initOriginStory() {
    var visual = document.querySelector("[data-origin-visual]");
    var caption = document.querySelector("[data-origin-caption]");
    var steps = document.querySelectorAll("[data-story-step]");
    if (!visual || !steps.length) return;

    var captions = {
      robot: "Robotics power system",
      load: "Load replacement check",
      incident: "Thermal failure signal",
      question: "Energy safety question",
      mission: "the ZSMC research direction"
    };

    function setState(state) {
      visual.setAttribute("data-state", state);
      if (caption && captions[state]) caption.textContent = captions[state];
    }

    function updateActiveStep() {
      var viewportCenter = window.innerHeight * 0.52;
      var activeState = "robot";
      var closestDistance = Infinity;

      steps.forEach(function (step) {
        var rect = step.getBoundingClientRect();
        var stepCenter = rect.top + rect.height * 0.5;
        var distance = Math.abs(stepCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeState = step.getAttribute("data-story-step") || activeState;
        }
      });

      setState(activeState);
    }

    var scheduled = false;
    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        updateActiveStep();
      });
    }

    setState("robot");
    updateActiveStep();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
  }

  function initHeroField() {
    var canvas = document.getElementById("hero-field");
    if (!canvas || !window.THREE) return;

    var scene = new THREE.Scene();
    var renderer;
    var renderScale = reduceMotion ? 1.1 : mobileLike ? 1.35 : 1.75;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !mobileLike,
        alpha: true,
        powerPreference: mobileLike ? "low-power" : "high-performance"
      });
    } catch (error) {
      canvas.classList.add("is-fallback");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderScale));

    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.2, 8);

    var group = new THREE.Group();
    scene.add(group);

    var particleCount = reduceMotion ? 220 : mobileLike ? 420 : 820;
    var positions = new Float32Array(particleCount * 3);
    var colors = new Float32Array(particleCount * 3);
    var palette = [
      new THREE.Color("#79c7d7"),
      new THREE.Color("#d4df73"),
      new THREE.Color("#b46f45"),
      new THREE.Color("#ffffff")
    ];

    for (var i = 0; i < particleCount; i += 1) {
      var layer = Math.random();
      var y = (layer - 0.5) * 4.9;
      var width = 0.9 + (1 - Math.abs(layer - 0.5) * 1.25) * 4.6;
      var x = (Math.random() - 0.5) * width;
      var z = (Math.random() - 0.5) * 3.8;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      var color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    var particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    var particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: mobileLike ? 0.032 : 0.025,
        vertexColors: true,
        transparent: true,
        opacity: 0.78
      })
    );
    group.add(particles);

    function makeLine(points, color, opacity) {
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity
      });
      return new THREE.Line(geometry, material);
    }

    var lineCount = mobileLike ? 7 : 12;
    for (var level = 0; level < lineCount; level += 1) {
      var t = lineCount === 1 ? 0 : level / (lineCount - 1);
      var yLevel = -2.3 + t * 4.6;
      var half = 0.4 + (1 - Math.abs(t - 0.5) * 1.45) * 2.7;
      var depth = 0.4 + (1 - Math.abs(t - 0.5)) * 1.4;
      var line = makeLine(
        [
          new THREE.Vector3(-half, yLevel, -depth),
          new THREE.Vector3(half, yLevel, -depth),
          new THREE.Vector3(half * 0.74, yLevel, depth),
          new THREE.Vector3(-half * 0.74, yLevel, depth),
          new THREE.Vector3(-half, yLevel, -depth)
        ],
        level % 3 === 0 ? "#b46f45" : "#79c7d7",
        0.2
      );
      group.add(line);
    }

    var apex = new THREE.Vector3(0, 2.75, 0);
    var base = [
      new THREE.Vector3(-2.9, -2.35, -1.4),
      new THREE.Vector3(2.9, -2.35, -1.4),
      new THREE.Vector3(2.1, -2.35, 1.55),
      new THREE.Vector3(-2.1, -2.35, 1.55)
    ];
    base.forEach(function (point) {
      group.add(makeLine([apex, point], "#ffffff", 0.2));
    });

    var mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", function (event) {
      mouse.x = event.clientX / window.innerWidth - 0.5;
      mouse.y = event.clientY / window.innerHeight - 0.5;
    });

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(1, rect.width);
      var height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    window.addEventListener("resize", resize);
    resize();

    var start = performance.now();
    function animate(now) {
      var elapsed = (now - start) * 0.001;
      group.rotation.y = Math.sin(elapsed * 0.16) * 0.16 + mouse.x * 0.18;
      group.rotation.x = Math.cos(elapsed * 0.12) * 0.08 + mouse.y * 0.1;
      particles.rotation.y = elapsed * 0.035;
      renderer.render(scene, camera);
      if (!reduceMotion) window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = document.getElementById("name").value;
      var email = document.getElementById("email").value;
      var topic = document.getElementById("topic").value;
      var message = document.getElementById("message").value;

      var subject = "The ZSMC Co. - " + topic;
      var body = "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Topic: " + topic + "\n\n" +
        "Message:\n" +
        message;

      var mailtoLink = "mailto:info@thezsmc.co""?" +
        "subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailtoLink;
    });
  }

  function initSchematicExplorer() {
    var explorer = document.querySelector("[data-schematic-explorer]");
    if (!explorer) return;

    var visual = explorer.querySelector("[data-schematic-visual]");
    var readout = explorer.querySelector("[data-schematic-readout]");
    var controls = explorer.querySelectorAll("[data-schematic-control]");

    var copy = {
      system: "System view: all layers active and balanced.",
      anode: "Anode view: zinc deposition and current distribution are emphasized.",
      electrolyte: "Electrolyte view: transport path and interface stability are emphasized.",
      cathode: "Cathode view: redox activity and plateau behavior are emphasized."
    };

    function setLayer(layer) {
      if (!visual) return;
      visual.setAttribute("data-layer", layer);
      if (readout) readout.textContent = copy[layer] || copy.system;

      controls.forEach(function (control) {
        var active = control.getAttribute("data-schematic-control") === layer;
        control.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    controls.forEach(function (control) {
      var layer = control.getAttribute("data-schematic-control") || "system";
      control.addEventListener("click", function () {
        setLayer(layer);
      });
    });

    setLayer("system");
  }

  function clearDesktopDropdowns() {
  if (window.innerWidth > 760) {
    document.querySelectorAll(".nav-dropdown.active")
      .forEach(function (dropdown) {
        dropdown.classList.remove("active");
      });
  }
}

window.addEventListener("resize", clearDesktopDropdowns);
clearDesktopDropdowns();

  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();
  setActiveNav();
  initNavigation();
  initReveal();
  initOriginStory();
  initHeroField();
  initContactForm();
  initSchematicExplorer();
})();
