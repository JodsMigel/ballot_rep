require('dotenv').config();
const { ethers } = require("ethers");
const metadata = require("../artifacts/contracts/ballot.sol/Ballot.json") 

const forPay = ethers.utils.parseEther("0.01")

async function getContract(hre)  {
    const [owner] = await hre.ethers.getSigners()
    return await new hre.ethers.Contract(process.env.ADDRESS, metadata.abi, owner)
}

task("create", "Create a new ballot")
    .addParam("candidates", "Array of candidates addresses")
    .setAction(async (taskArgs, hre) => {

    const candidatesArray = taskArgs.candidates.split(",")
    const ballot = await getContract(hre);
    const tx = await ballot.createBallot(candidatesArray)
    console.log(tx.hash)
    
});

task("vote", "Vote to candidate")
    .addParam("ballot", "number of ballot to vote")
    .addParam("candidate", "number of candidate")
    .setAction(async (taskArgs, hre) => {

    const ballot = await getContract(hre);
    const tx = await ballot.vote(taskArgs.ballot, taskArgs.candidate, {value : forPay})
    console.log(tx.hash)
    
});



task("finish", "Finish ballot")
    .addParam("ballot", "number of ballot to finish")
    .setAction(async (taskArgs, hre) => {

    const ballot = await getContract(hre);
    const tx = await ballot.finishVoting(taskArgs.ballot)
    console.log(tx.hash)
    
});

task("withdraw", "withdraw owner's fee")
    .setAction(async (taskArgs, hre) => {

    const ballot = await getContract(hre);
    const tx = await ballot.withdrawFee()
    console.log(tx.hash)
    
});

