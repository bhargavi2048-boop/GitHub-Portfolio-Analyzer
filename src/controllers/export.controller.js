const PDFDocument = require("pdfkit");
const { analyze } = require("../services/github.service");

exports.pdf = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();
    const data = await analyze(username);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${username}-portfolio.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(24).fillColor("#0d7377").text("GitHub Portfolio Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).fillColor("#1a1a1a").text(`@${data.profile.login}`, { align: "center" });
    if (data.profile.name) doc.fontSize(12).fillColor("#666").text(data.profile.name, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#051d2a").text("Overall Score");
    doc.fontSize(36).fillColor("#0d7377").text(`${data.score.total}/100  ·  Rank ${data.score.rank}`);
    doc.moveDown();

    doc.fontSize(14).fillColor("#051d2a").text("ATS Score");
    doc.fontSize(20).fillColor("#14919b").text(`${data.score.ats}/100`);
    doc.moveDown();

    doc.fontSize(14).fillColor("#051d2a").text("Pillars");
    Object.entries(data.score.pillars).forEach(([k, v]) => {
      doc.fontSize(11).fillColor("#1a1a1a").text(`• ${k}: ${v}`);
    });
    doc.moveDown();

    doc.fontSize(14).fillColor("#051d2a").text("Top languages");
    data.stats.languages.slice(0, 8).forEach((l) => {
      doc.fontSize(11).fillColor("#1a1a1a").text(`• ${l.name} — ${l.value}`);
    });
    doc.moveDown();

    doc.fontSize(14).fillColor("#051d2a").text("Top repositories");
    data.stats.topRepos.forEach((r) => {
      doc.fontSize(11).fillColor("#1a1a1a").text(`• ${r.name} — ★${r.stargazers_count}`);
      if (r.description) doc.fontSize(9).fillColor("#666").text(`   ${r.description}`);
    });

    doc.end();
  } catch (e) { next(e); }
};
