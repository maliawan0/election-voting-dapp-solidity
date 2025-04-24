const Election = artifacts.require("./Election.sol");

contract("Election", function(accounts) {
  let electionInstance;

  // Deploy a fresh contract before each test
  beforeEach(async () => {
    electionInstance = await Election.new();
  });

  it("initializes with two candidates", async () => {
    const count = await electionInstance.candidatesCount();
    assert.equal(count.toNumber(), 2, "there should be exactly 2 candidates");
  });

  it("initializes the candidates with the correct values", async () => {
    // Candidate 1
    let candidate = await electionInstance.candidates(1);
    assert.equal(candidate[0].toNumber(), 1, "contains the correct id");
    assert.equal(candidate[1], "Candidate 1", "contains the correct name");
    assert.equal(candidate[2].toNumber(), 0, "contains the correct vote count");

    // Candidate 2
    candidate = await electionInstance.candidates(2);
    assert.equal(candidate[0].toNumber(), 2, "contains the correct id");
    assert.equal(candidate[1], "Candidate 2", "contains the correct name");
    assert.equal(candidate[2].toNumber(), 0, "contains the correct vote count");
  });

  it("allows a voter to cast a vote", async () => {
    const candidateId = 1;
    const receipt = await electionInstance.vote(candidateId, { from: accounts[0] });

    // Event
    assert.equal(receipt.logs.length, 1, "an event was triggered");
    assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
    assert.equal(
      receipt.logs[0].args._candidateId.toNumber(),
      candidateId,
      "the candidate id in the event matches"
    );

    // Voter marked
    const voted = await electionInstance.voters(accounts[0]);
    assert(voted, "the voter was marked as voted");

    // Vote count incremented
    const candidate = await electionInstance.candidates(candidateId);
    assert.equal(candidate[2].toNumber(), 1, "increments the candidate's vote count");
  });

  it("throws an exception for invalid candidates", async () => {
    try {
      await electionInstance.vote(99, { from: accounts[1] });
      assert.fail("Expected revert not received");
    } catch (error) {
      assert(
        error.message.includes("revert"),
        `error message must contain 'revert', got '${error.message}'`
      );
    }

    // Ensure no tally changed
    const c1 = await electionInstance.candidates(1);
    assert.equal(c1[2].toNumber(), 0, "candidate 1 did not receive any votes");
    const c2 = await electionInstance.candidates(2);
    assert.equal(c2[2].toNumber(), 0, "candidate 2 did not receive any votes");
  });

  it("throws an exception for double voting", async () => {
    const candidateId = 2;

    // First vote should succeed
    await electionInstance.vote(candidateId, { from: accounts[1] });
    let candidate = await electionInstance.candidates(candidateId);
    assert.equal(candidate[2].toNumber(), 1, "accepts first vote");

    // Second vote should revert
    try {
      await electionInstance.vote(candidateId, { from: accounts[1] });
      assert.fail("Expected revert not received on double-vote");
    } catch (error) {
      assert(
        error.message.includes("revert"),
        `error message must contain 'revert', got '${error.message}'`
      );
    }

    // Ensure counts didn’t change for either candidate
    const c1 = await electionInstance.candidates(1);
    assert.equal(c1[2].toNumber(), 0, "candidate 1 did not receive any votes");
    const c2 = await electionInstance.candidates(candidateId);
    assert.equal(c2[2].toNumber(), 1, "candidate 2 vote count remains unchanged");
  });
});
