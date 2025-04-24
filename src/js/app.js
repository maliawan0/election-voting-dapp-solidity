App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: async function() {
    await App.initWeb3();
    App.bindEvents();
  },

  initWeb3: async function() {
    // Modern dapp browsers
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
    }
    // Legacy dapp browsers
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(window.web3.currentProvider);
    }
    // Fallback to local provider
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      window.web3 = new Web3(App.web3Provider);
    }
    App.contracts.Election = TruffleContract(await $.getJSON('Election.json'));
    App.contracts.Election.setProvider(App.web3Provider);
    App.listenForEvents();
    // Do not render until wallet is connected
  },

  bindEvents: function() {
    document
      .getElementById('connectWallet')
      .addEventListener('click', App.connectWallet);
  },

  connectWallet: async function() {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      App.account = accounts[0];
      document.getElementById('accountAddress').innerText = 'Connected: ' + App.account;

      // Now we can render the dApp
      App.render();
    } catch (error) {
      console.error('User denied account access', error);
      alert('Unable to connect wallet. Please authorize this app in MetaMask.');
    }
  },

  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, { fromBlock: 0, toBlock: 'latest' })
        .watch(function(error, event) {
          if (!error) {
            console.log('Event triggered', event);
            App.render();
          }
        });
    });
  },

  render: function() {
    const loader = $('#loader');
    const content = $('#content');

    // Ensure wallet is connected
    if (App.account === '0x0') {
      loader.hide();
      content.show(); // show connect button
      return;
    }

    loader.show();
    content.hide();

    // Load contract data
    App.contracts.Election.deployed()
      .then(function(instance) {
        return instance.candidatesCount();
      })
      .then(function(candidatesCount) {
        let candidatesResults = $('#candidatesResults');
        candidatesResults.empty();

        let candidatesSelect = $('#candidatesSelect');
        candidatesSelect.empty();

        for (let i = 1; i <= candidatesCount; i++) {
          App.contracts.Election.deployed().then(function(instance) {
            return instance.candidates(i);
          }).then(function(candidate) {
            const id = candidate[0];
            const name = candidate[1];
            const voteCount = candidate[2];

            // Render candidate result
            const candidateTemplate = `<tr><th>${id}</th><td>${name}</td><td>${voteCount}</td></tr>`;
            candidatesResults.append(candidateTemplate);

            // Render candidate option
            const candidateOption = `<option value='${id}'>${name}</option>`;
            candidatesSelect.append(candidateOption);
          });
        }
        return App.contracts.Election.deployed().then(function(instance) {
          return instance.voters(App.account);
        });
      })
      .then(function(hasVoted) {
        if (hasVoted) {
          $('form').hide();
        }
        loader.hide();
        content.show();
      })
      .catch(function(error) {
        console.warn(error);
      });
  },

  castVote: function() {
    const candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed()
      .then(function(instance) {
        return instance.vote(candidateId, { from: App.account });
      })
      .then(function(result) {
        $('#content').hide();
        $('#loader').show();
      })
      .catch(function(err) {
        console.error(err);
      });
  }
};

$(window).on('load', function() {
  App.init();
});
