var schApp = new Vue({
    el: "#sch-container",
    data: {
        sChain: new sch_module.SChain(),
        activePane: 'identity',

        // Inputs
        identitySeedInput: "sch",
        assetInput: "",
        actionInput: "",
        otherFirmInput: "",
        activeTransaction: {
            "asset": {
                "data": {
                    "item": "Loading..."
                }
            }
        },

        // Assets
        transactionIds: new Array(),
        assets: new Array(),
        transactionsForAsset: new Array(),
        allAssets: new Array(),

        // Flag
        myAssets: false,
    },
    methods: {
        setActive(pane) {
            this.activePane = pane;
        },
        isActive(pane) {
            return this.activePane == pane;
        },
        getAssets() {
            return this.assets;
        },

        // Forms
        identityButtonClicked() {
            this.sChain.currentIdentity = this.sChain.generateKeypair(this.identitySeedInput);
        },
        assetButtonClicked() {
            if (this.assetInput == "") return;
            this.sChain.createAsset(this.assetInput).then(response => {

                console.log("New asset added.");
                // Do nothing, just reload the asset list.
                schApp.loadAssetsIds();
            });
        },

        // Menu
        menuClicked(link) {

            switch (link) {
                case "identity":
                    this.activePane = "identity";
                    break;

                case "assets":
                    this.loadAssetsIds();
                    this.activePane = "assets";
                    break;

                case "all-assets":
                    this.loadAllAssets();
                    this.activePane = "all-assets";
                    break;
            }
        },

        // Loading assets
        loadAssetsIds() {

            this.sChain.getAssets().then(response => {
                schApp.transactionIds = response;
                schApp.loadAssetsFromTransactionIds();
            });

        },
        loadAllAssets() {
            this.sChain.getAllAssets().then( response => {
                schApp.allAssets = response;
            });
        },
        loadAssetsFromTransactionIds() {

            this.assets = new Array();

            for (let transaction of this.transactionIds) {
                this.sChain.connection.getTransaction(transaction.transaction_id).then(response => {
                    if (response.operation == 'CREATE') return schApp.sChain.connection.listTransactions(response.id, 'CREATE');
                    return schApp.sChain.connection.listTransactions(response.asset.id, 'CREATE');
                }).then(responseCreate => {
                    schApp.assets.push(responseCreate[0]);
                }).catch(err => {
                    console.log(transaction.transaction_id);
                })
            }
        },
        transactionClicked(id, myAssets) {
            this.myAssets = myAssets;
            this.sChain.connection.getTransaction(id).then(response => schApp.activeTransaction = response);
            this.loadTransactionsForAsset(id);
            this.setActive('transactions');
        },
        loadTransactionsForAsset(assetId) {

            this.sChain.connection.listTransactions(assetId).then(response => schApp.transactionsForAsset = response);
        },
        actionButtonClicked() {
            this.sChain.connection.listTransactions(this.activeTransaction.id).then(response => {
                return schApp.sChain.updateAsset(response[response.length - 1], schApp.actionInput);
            }).then(response => {
                schApp.loadTransactionsForAsset(schApp.activeTransaction.id);
            });
        },
        otherFirmButtonClicked() {
            this.sChain.connection.listTransactions(this.activeTransaction.id).then(response => {
                return this.sChain.transferAsset(response[response.length -1], schApp.sChain.generateKeypair(schApp.otherFirmInput).publicKey);
            }).then( response => {
                // Don't do anything with the response, go back to asset overview.
                schApp.menuClicked('assets');
            });
        },
    }
});