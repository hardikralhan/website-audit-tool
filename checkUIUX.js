const puppeteer = require('puppeteer');

async function checkUIUX(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const report = {
    buttons: [],
    whitespace: [],
    navigation: [],
    modals: [],
    dropdowns: [],
    hoverEffects: []
  };

  // 1️⃣ Buttons: Check for inconsistent button styles
  const buttons = await page.$$eval('button', btns => {
    return btns.map((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      return {
        index: idx,
        text: btn.innerText.trim(),
        font: window.getComputedStyle(btn).fontFamily,
        color: window.getComputedStyle(btn).color,
        backgroundColor: window.getComputedStyle(btn).backgroundColor,
        position: { x: rect.x, y: rect.y }
      };
    });
  });
  // Group button styles by a signature of font, color and backgroundColor.
  const buttonStylesMap = {};
  buttons.forEach(btn => {
    const key = `${btn.font}|${btn.color}|${btn.backgroundColor}`;
    if (!buttonStylesMap[key]) {
      buttonStylesMap[key] = [];
    }
    buttonStylesMap[key].push(btn);
  });
  if (Object.keys(buttonStylesMap).length > 1) {
    report.buttons.push({
      message: "Inconsistent button styles detected",
      details: buttonStylesMap
    });
  }

  // 2️⃣ Whitespace: Detect areas that may be too crowded by checking margins/paddings on common container elements.
  // This example checks for div, section, and article elements with very low vertical spacing.
  const whitespaceIssues = await page.$$eval('div, section, article', elems => {
    const issues = [];
    elems.forEach(elem => {
      const style = window.getComputedStyle(elem);
      const marginTop = parseFloat(style.marginTop);
      const marginBottom = parseFloat(style.marginBottom);
      const paddingTop = parseFloat(style.paddingTop);
      const paddingBottom = parseFloat(style.paddingBottom);
      // Heuristic: If any of these values are below 10px, we flag it.
      if (marginTop < 10 || marginBottom < 10 || paddingTop < 10 || paddingBottom < 10) {
        const rect = elem.getBoundingClientRect();
        issues.push({
          tag: elem.tagName,
          className: elem.className,
          id: elem.id,
          position: { x: rect.x, y: rect.y },
          margins: { top: marginTop, bottom: marginBottom },
          paddings: { top: paddingTop, bottom: paddingBottom }
        });
      }
    });
    return issues;
  });
  if (whitespaceIssues.length > 0) {
    report.whitespace.push({
      message: "Poor whitespace usage detected (elements with low margin/padding)",
      details: whitespaceIssues
    });
  }

  // 3️⃣ Navigation & Menu Structure: Look for <nav> elements and evaluate if they contain links.
  const navigationIssues = await page.$$eval('nav', navs => {
    const issues = [];
    if (navs.length === 0) {
      issues.push("No <nav> element found on the page.");
    } else {
      navs.forEach((nav, idx) => {
        const links = nav.querySelectorAll('a');
        if (links.length === 0) {
          issues.push(`Navigation bar #${idx + 1} contains no links.`);
        }
        // Additional heuristics might include checking if link texts are clear.
      });
    }
    return issues;
  });
  if (navigationIssues.length > 0) {
    report.navigation.push({
      message: "Navigation/menu structure issues detected",
      details: navigationIssues
    });
  }

  // 4️⃣ Modal Pop-ups: Identify elements that look like modals using common selectors.
  const modalIssues = await page.$$eval('.modal, .popup, [role="dialog"]', modals => {
    return modals.map((modal, idx) => {
      const rect = modal.getBoundingClientRect();
      return {
        index: idx,
        tag: modal.tagName,
        className: modal.className,
        position: { x: rect.x, y: rect.y },
        dimensions: { width: rect.width, height: rect.height }
      };
    });
  });
  if (modalIssues.length > 0) {
    report.modals.push({
      message: "Modal/pop-up elements detected",
      details: modalIssues
    });
  }

  // 5️⃣ Dropdowns: Identify <select> elements or elements with a dropdown class.
  const dropdownIssues = await page.$$eval('select, .dropdown', dropdowns => {
    return dropdowns.map((drop, idx) => {
      const rect = drop.getBoundingClientRect();
      return {
        index: idx,
        tag: drop.tagName,
        className: drop.className,
        position: { x: rect.x, y: rect.y },
        dimensions: { width: rect.width, height: rect.height }
      };
    });
  });
  if (dropdownIssues.length > 0) {
    report.dropdowns.push({
      message: "Dropdown elements detected",
      details: dropdownIssues
    });
  }

  // 6️⃣ Hover Effects: Find elements that have an onmouseover attribute as a basic heuristic for hover effects.
  const hoverIssues = await page.$$eval('*[onmouseover]', elems => {
    return elems.map((elem, idx) => {
      const rect = elem.getBoundingClientRect();
      return {
        index: idx,
        tag: elem.tagName,
        className: elem.className,
        id: elem.id,
        position: { x: rect.x, y: rect.y }
      };
    });
  });
  if (hoverIssues.length > 0) {
    report.hoverEffects.push({
      message: "Elements with hover effects detected",
      details: hoverIssues
    });
  }

  await browser.close();
  return report;
}

module.exports = { checkUIUX };
