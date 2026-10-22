module.exports = require('./connection.js');
if (require.main === module) {
  require('./connection.js').startConnection();
}
