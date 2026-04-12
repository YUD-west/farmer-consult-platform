const marketRepo = require("../repositories/marketRepo");

async function list(req, res, next) {
  try {
    const { region, type, q, limit } = req.query;
    const rows = await marketRepo.listProducts({ region, type, q, limit });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const row = await marketRepo.createProduct({
      sellerId: req.user.id,
      ...req.body,
      imageUrl: req.body.imageUrl || null,
    });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const patch = { ...req.body };
    if (patch.imageUrl !== undefined) {
      patch.image_url = patch.imageUrl;
      delete patch.imageUrl;
    }
    const isAdmin = req.user.role === "admin";
    const row = await marketRepo.updateProduct(req.params.id, patch, {
      sellerId: req.user.id,
      isAdmin,
    });
    if (!row) return res.status(404).json({ error: "Product not found or not owned by you." });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update };
