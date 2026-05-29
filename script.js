(function () {
	'use strict';

	function getTabNameFromButton(btn) {
		const raw = btn && btn.dataset ? btn.dataset.tab : '';
		return (raw || '').trim();
	}

	function setupTabs() {
		const tabList = document.querySelector('.nav-tabs-section');
		const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

		if (!tabList || tabButtons.length === 0) return;

		// Accessibility wiring (no HTML edits needed)
		tabList.setAttribute('role', 'tablist');

		const nameToSection = new Map();
		for (const btn of tabButtons) {
			const tabName = getTabNameFromButton(btn);
			if (!tabName) continue;

			const section = document.getElementById(tabName);
			if (section) nameToSection.set(tabName, section);
		}

		for (const [idx, btn] of tabButtons.entries()) {
			btn.type = 'button';
			btn.setAttribute('role', 'tab');

			const tabName = getTabNameFromButton(btn);
			const section = tabName ? nameToSection.get(tabName) : null;
			if (section) {
				const tabId = `tab-${tabName}`;
				btn.id = btn.id || tabId;
				btn.setAttribute('aria-controls', section.id);

				section.setAttribute('role', 'tabpanel');
				section.setAttribute('aria-labelledby', btn.id);
			}

			// Ensure a deterministic tab order.
			btn.tabIndex = idx === 0 ? 0 : -1;
		}

		function setActiveTab(tabName, opts) {
			const options = opts || {};

			const targetSection = nameToSection.get(tabName);
			const targetButton = tabButtons.find((b) => getTabNameFromButton(b) === tabName);
			if (!targetButton || !targetSection) return;

			for (const btn of tabButtons) {
				const isActive = btn === targetButton;
				btn.classList.toggle('active', isActive);
				btn.setAttribute('aria-selected', String(isActive));
				btn.tabIndex = isActive ? 0 : -1;
			}

			for (const section of nameToSection.values()) {
				const isActive = section === targetSection;
				section.classList.toggle('active', isActive);
				section.hidden = !isActive;
			}

			if (options.focus === true) {
				targetButton.focus({ preventScroll: true });
			}
		}

		// Make sure non-active panels are hidden for a11y.
		// (CSS already handles display; `hidden` helps screen readers.)
		for (const btn of tabButtons) {
			const tabName = getTabNameFromButton(btn);
			const section = tabName ? nameToSection.get(tabName) : null;
			if (!section) continue;

			const isActive = btn.classList.contains('active') || section.classList.contains('active');
			section.hidden = !isActive;
			btn.setAttribute('aria-selected', String(isActive));
			btn.tabIndex = isActive ? 0 : -1;
		}

		// Default active tab: first `.tab-btn.active`, else first button.
		const defaultBtn = tabButtons.find((b) => b.classList.contains('active')) || tabButtons[0];
		const defaultTab = getTabNameFromButton(defaultBtn);
		if (defaultTab) setActiveTab(defaultTab, { focus: false });

		// If URL has a hash matching a section id, honor it on initial load.
		const initialHash = (window.location.hash || '').replace('#', '').trim();
		if (initialHash && nameToSection.has(initialHash)) {
			setActiveTab(initialHash, { focus: false });
		}

		tabList.addEventListener('click', (e) => {
			const btn = e.target instanceof Element ? e.target.closest('.tab-btn') : null;
			if (!btn) return;

			const tabName = getTabNameFromButton(btn);
			if (!tabName) return;

			setActiveTab(tabName, { focus: false });
		});

		tabList.addEventListener('keydown', (e) => {
			const activeEl = document.activeElement;
			if (!(activeEl instanceof HTMLElement)) return;
			if (!activeEl.classList.contains('tab-btn')) return;

			const currentIndex = tabButtons.indexOf(activeEl);
			if (currentIndex < 0) return;

			let nextIndex = -1;
			if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
			else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
			else if (e.key === 'Home') nextIndex = 0;
			else if (e.key === 'End') nextIndex = tabButtons.length - 1;
			else if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				const tabName = getTabNameFromButton(activeEl);
				if (tabName) setActiveTab(tabName, { focus: false });
				return;
			} else {
				return;
			}

			e.preventDefault();
			const nextBtn = tabButtons[nextIndex];
			nextBtn.focus();
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupTabs);
	} else {
		setupTabs();
	}
})();

