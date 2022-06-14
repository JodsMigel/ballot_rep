const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

//require вынести в отдельные тесты, а тесты функций отдельно
//Сделать "дерево" из describe

describe("Ballot", function () {
    

    let owner
    let acc1
    let acc2
    let acc3
    let acc4
    let acc5
    const payForVote = ethers.utils.parseEther("0.01")
    let ballot
    const provider = waffle.provider;

    beforeEach(async function(){
        [owner, acc1, acc2, acc3, acc4, acc5 ] = await ethers.getSigners()
        const BALLOT = await ethers.getContractFactory("Ballot", owner)
        ballot = await BALLOT.deploy()
        await ballot.deployed()
    })

    async function wait_time () {
        await network.provider.send("evm_increaseTime", [260000])
        await network.provider.send("evm_mine")
    }

    it("owner address is correct", async function(){
        expect(await ballot.owner()).to.eq(owner.address)
    })

    //require tests
    //=================
    it("Could create a ballot only by owner", async function(){
        await expect(ballot.connect(acc1).createBallot([acc1.address, acc2.address])).to.be.revertedWith(`Only owner can use this function`);    
    })

    it("Couldn't vote twice", async function() {
        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})    
        await expect(ballot.connect(acc1).vote(0,0, {value : payForVote})).to.be.revertedWith(`already is Voted`);
        expect(await ballot.connect(acc1).isVotedView(0)).to.eq(true)
    })

    it("Can not vote after finish and can't vote without payment", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        await expect(ballot.connect(acc1).vote(0,0, {value : 500})).to.be.revertedWith(`Please pay 0.01 ETH for voting`);
        await wait_time()
        await expect(ballot.connect(acc1).vote(0,0, {value : payForVote})).to.be.revertedWith(`Voting is over, please check voting number`);
    }) 

    it("Can not finish voting before the end and can after", async function(){

        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        await expect(ballot.connect(acc1).finishVoting(0)).to.be.revertedWith(`Voting is not finished yet`);
        await wait_time()
        await ballot.connect(acc1).finishVoting(0)
        expect(await ballot.candidateAddr(0,0)).to.eq(await ballot.candidateAddr(0,(await ballot.allVotings(0))[2]))

    })

    it("Can not finish voting twice", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        await wait_time()
        await ballot.connect(acc1).finishVoting(0)
        await expect(ballot.connect(acc1).finishVoting(0)).to.be.revertedWith(`Already finished`);

    })

    it("Can not finish voting if no participants", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        await wait_time()
        await ballot.connect(acc1).finishVoting(0)
        expect(await ballot.provider.getBalance(ballot.address)).to.eq(0);
    })
    //==========

    it("Counting number of ballot and addresses of candidate are correct", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        expect(await ballot.numberOfBallot()).to.eq(1)
        await ballot.createBallot([acc3.address, acc4.address])
        expect(await ballot.numberOfBallot()).to.eq(2)
        expect(await ballot.candidateAddr(0,0)).to.eq(acc1.address)
        expect(await ballot.candidateAddr(0,1)).to.eq(acc2.address)
        expect(await ballot.candidateAddr(1,0)).to.eq(acc3.address)
        expect(await ballot.candidateAddr(1,1)).to.eq(acc4.address)    
    })

    it("Could vote", async function() {
        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        expect(await ballot.howManyScore(0,0)).to.eq(1)
        await ballot.connect(acc2).vote(0,0, {value : payForVote})
        expect(await ballot.howManyScore(0,0)).to.eq(2)        
    })




    it("Choosed correct winner", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        await ballot.connect(acc2).vote(0,0, {value : payForVote})
        await ballot.connect(acc3).vote(0,1, {value : payForVote})
        await ballot.connect(acc4).vote(0,1, {value : payForVote})
        await ballot.connect(acc5).vote(0,1, {value : payForVote})
        expect((await ballot.allVotings(0))[2]).to.eq(1)
        expect(await ballot.whoIsWinner(0)).to.eq(1)
    })

    it("Send money to winner", async function(){

        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        await ballot.connect(acc2).vote(0,0, {value : payForVote})
        await wait_time()
        let winner_balance = await ethers.provider.getBalance(await ballot.candidateAddr(0,(await ballot.allVotings(0))[2]));
        let payout = ethers.utils.parseEther("0.018")
        await expect(() => ballot.connect(acc1).finishVoting(0)).changeEtherBalances([ballot, acc1], ["-"+payout,payout])


    })

    it("Withdraw owner fee", async function(){
        await ballot.createBallot([acc1.address, acc2.address])
        await ballot.connect(acc1).vote(0,0, {value : payForVote})
        await ballot.connect(acc2).vote(0,0, {value : payForVote})
        expect(await ballot.contractFeeToWithdraw()).to.eq(ethers.utils.parseEther("0.002"))
        let fee_payout = await ballot.contractFeeToWithdraw()
        await expect(() => ballot.withdrawFee()).changeEtherBalances([ballot, owner], ["-"+fee_payout,fee_payout])
    }) 


});


