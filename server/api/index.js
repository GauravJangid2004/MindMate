const connectDB = require('../src/config/db');
const app = require('../src/index');

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
