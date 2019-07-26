App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  rendering: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    if (App.rendering){
      return;
    }
    App.rendering = true;
    App.isAdmin = false;
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var notAuthorized = $("#notAuthorized");

    loader.show();
    content.hide();
    notAuthorized.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
    //check if owner of contract
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.owner();
    }).then(function(owner) {
      if (owner === App.account) {
        App.isAdmin = true;
      }
    });

    // if (! App.isAdmin) {
    // loader.hide();
    // content.hide();
    // notAuthorized.show();
    //   return;
    //
    // }
    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
              electionInstance.candidates(i).then(function(candidate) {
                var id = candidate[0];
                var name = candidate[1];
                var voteCount = candidate[2];

                // Render candidate Result
                var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                candidatesResults.append(candidateTemplate);

                // Render candidate ballot option
                var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
                candidatesSelect.append(candidateOption);
              });
            }
            return electionInstance.voters(App.account);
          }).then(function(hasVoted) {
            App.rendering = false
            sortTable();
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },
  addCandidate: function() {
    var candidateName = $('#addCandidate').val();
    console.log(candidateName);
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(candidateName, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },
  addVoter: function() {
    var voterAddress = $('#addVoter').val();
    console.log(voterAddress);
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addVoter(voterAddress, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
      App.Render();
    }).catch(function(err) {
      console.error(err);
    });
  },
  addVoterFromFile: function() {
    var voterAddress = $('#addVoterFromFile').val();
    console.log(voterAddress);
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addVoter(voterAddress, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
      App.Render();
    }).catch(function(err) {
      console.error(err);
    });
  },
  openFile: function(event) {
  var input = event.target;

  var reader = new FileReader();
  reader.onload = function(){
    var dataURL = reader.result;
    var output = document.getElementById('output');
    output.src = dataURL;
    console.log(dataURL);
  };
  reader.readAsDataURL(input.files[0]);
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

 function sortTable(){
   console.log("sorting...");
  var rows = $('#mytable tbody  tr').get();

  rows.sort(function(a, b) {

  var A = $(a).children('td').eq(1).text().toUpperCase();
  var B = $(b).children('td').eq(1).text().toUpperCase();

  if(A < B) {
    return 1;
  }

  if(A > B) {
    return -1;
  }

  return 0;

  });
  $.each(rows, function(index, row) {
    $('#mytable').children('tbody').append(row);
  });
}
