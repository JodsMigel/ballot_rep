require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('dotenv').config();
require("./tasks");


module.exports = {
  solidity: '0.8.4',

  networks: {
    hardhat: {
      chainId: 1337,
    },
    rinkeby: {
      url: `${process.env.INFURA_URL}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },

  //defaultNetwork : "rinkeby"
};