var Election = artifacts.require("./Election.sol");

module.exports = function(deployer) {
  deployer.deploy(Election, 12 * 60 * 60 * 1000);
};
