/*
  Keep Judge Lisa L. Langford 2026 — Dynamic Content Renderer
  -----------------------------------------------------------
  Reads data/events.json and data/news.json and renders them into
  any container on the page marked with:

    data-events-target="sidebar"  → Upcoming Events sidebar (top 3 upcoming)
    data-events-target="full"     → Full events list (Events page)
    data-news-target="latest"     → Campaign News on the homepage (top 3 most recent)

  If a fetch fails (e.g. file missing), the existing fallback HTML
  inside the container is left untouched, so the site degrades gracefully.
*/

(function () {
	'use strict';

	// ---- Helpers ----------------------------------------------------

	function escapeHtml(str) {
		if (str === null || str === undefined) return '';
		return String(str).replace(/[&<>"']/g, function (c) {
			return ({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[c];
		});
	}

	function formatDate(iso) {
		if (!iso) return 'TBD 2026';
		var parts = iso.split('-');
		if (parts.length !== 3) return iso;
		var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function sortByDateAsc(items) {
		return items.slice().sort(function (a, b) {
			// Entries without dates sort to the bottom
			if (!a.date && !b.date) return 0;
			if (!a.date) return 1;
			if (!b.date) return -1;
			return a.date.localeCompare(b.date);
		});
	}

	function sortByDateDesc(items) {
		return items.slice().sort(function (a, b) {
			if (!a.date && !b.date) return 0;
			if (!a.date) return 1;
			if (!b.date) return -1;
			return b.date.localeCompare(a.date);
		});
	}

	function isUpcoming(iso) {
		if (!iso) return true; // TBD events still count as upcoming
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var parts = iso.split('-');
		if (parts.length !== 3) return true;
		var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
		return d.getTime() >= today.getTime();
	}

	// ---- Renderers --------------------------------------------------

	function renderEventsSidebar(container, events) {
		var items = sortByDateAsc(
			events.filter(function (e) {
				return e.showInSidebar !== false && isUpcoming(e.date);
			})
		).slice(0, 3);

		if (items.length === 0) return; // keep fallback if nothing to show

		var html = items.map(function (e) {
			var when = escapeHtml(formatDate(e.date));
			if (e.time) when += ' &nbsp; ' + escapeHtml(e.time);
			var tag = e.sidebarLabel
				? ' <small>(' + escapeHtml(e.sidebarLabel) + ')</small>'
				: '';
			return (
				'<li class="event_list_item">' +
					'<div class="when">' + when + tag + '</div>' +
					'<div class="event"><a href="events.html">' + escapeHtml(e.title) + '</a></div>' +
				'</li>'
			);
		}).join('');

		container.innerHTML = html;
	}

	function renderEventsFull(container, events) {
		var items = sortByDateAsc(events.filter(function (e) {
			return isUpcoming(e.date);
		}));
		if (items.length === 0) return;

		var cards = items.map(function (e) {
			var when = escapeHtml(formatDate(e.date));
			if (e.time) when += ' &nbsp; ' + escapeHtml(e.time);
			var location = escapeHtml(e.location || 'Jefferson County, Kentucky');
			var description = escapeHtml(e.description || '').replace(/\n+/g, '</p><p>');
			var ctaHtml = '';
			if (e.ctaText && e.ctaUrl) {
				var isExternal = /^https?:\/\//i.test(e.ctaUrl);
				ctaHtml =
					'<a href="' + escapeHtml(e.ctaUrl) + '" class="button"' +
					(isExternal ? ' target="_blank" rel="noopener"' : '') +
					'>' + escapeHtml(e.ctaText) + '</a>';
			}
			return (
				'<div style="background:#f9f6ff;border:1px solid #5B1FAB;border-radius:4px;padding:20px 25px;margin:20px 0;">' +
					'<h4 style="color:#5B1FAB;margin-bottom:5px;">' + escapeHtml(e.title) + '</h4>' +
					'<p style="color:#888;font-size:12px;margin-bottom:10px;">Date: ' + when + ' &nbsp;&#8226;&nbsp; ' + location + '</p>' +
					'<p>' + description + '</p>' +
					ctaHtml +
				'</div>'
			);
		}).join('');

		container.innerHTML = cards;
	}

	function renderNewsLatest(container, posts) {
		var items = sortByDateDesc(posts).slice(0, 3);
		if (items.length === 0) return;

		var head = '<h4 class="entry-title" id="latest-posts-title">Campaign News</h4>';
		var itemHtml = items.map(function (p) {
			var url = escapeHtml(p.url || '#');
			var img = escapeHtml(p.image || 'images/latest_fallback.png');
			return (
				'<div class="single_latest left">' +
					'<a href="' + url + '" class="single_latest_img_link">' +
						'<img width="170" height="120" src="' + img + '" alt="' + escapeHtml(p.title) + '" />' +
					'</a>' +
					'<h5><a href="' + url + '">' + escapeHtml(p.title) + '</a></h5>' +
					'<div class="meta">' + escapeHtml(formatDate(p.date)) + '</div>' +
				'</div>'
			);
		}).join('');

		container.innerHTML = head + itemHtml + '<div class="clear"></div>';
	}

	// ---- Init -------------------------------------------------------

	function init() {
		var eventSidebars = document.querySelectorAll('[data-events-target="sidebar"]');
		var eventFulls = document.querySelectorAll('[data-events-target="full"]');
		var newsLatests = document.querySelectorAll('[data-news-target="latest"]');

		if (eventSidebars.length || eventFulls.length) {
			fetch('data/events.json', { cache: 'no-cache' })
				.then(function (r) { return r.ok ? r.json() : null; })
				.then(function (data) {
					if (!data || !Array.isArray(data.events)) return;
					eventSidebars.forEach(function (c) { renderEventsSidebar(c, data.events); });
					eventFulls.forEach(function (c) { renderEventsFull(c, data.events); });
				})
				.catch(function (err) {
					console.warn('Keep Langford: could not load events.json. Falling back to static content.', err);
				});
		}

		if (newsLatests.length) {
			fetch('data/news.json', { cache: 'no-cache' })
				.then(function (r) { return r.ok ? r.json() : null; })
				.then(function (data) {
					if (!data || !Array.isArray(data.posts)) return;
					newsLatests.forEach(function (c) { renderNewsLatest(c, data.posts); });
				})
				.catch(function (err) {
					console.warn('Keep Langford: could not load news.json. Falling back to static content.', err);
				});
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
