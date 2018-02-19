"use strict";

const assert = require("chai").assert;
const setupTestDb = require("../../test.database");
const { processMintLog, processMintLogRemoval } = require("../../../build/blockchain/log-processors/token/mint");

describe("blockchain/log-processors/tokens-minted", () => {
  const test = (t) => {
    const getTokenBalances = (db, params, callback) => db("balances").where({ token: params.log.token }).asCallback(callback);
    it(t.description, (done) => {
      setupTestDb((err, db) => {
        assert.isNull(err);
        db.transaction((trx) => {
          processMintLog(db, t.params.augur, trx, t.params.log, (err) => {
            assert.isNull(err);
            getTokenBalances(trx, t.params, (err, records) => {
              t.assertions.onAdded(err, records);
              processMintLogRemoval(db, t.params.augur, trx, t.params.log, (err) => {
                assert.isNull(err);
                getTokenBalances(trx, t.params, (err, records) => {
                  t.assertions.onRemoved(err, records);
                  done();
                });
              });
            });
          });
        });
      });
    });
  };
  test({
    description: "Tokens minted",
    params: {
      log: {
        transactionHash: "TRANSACTION_HASH",
        logIndex: 0,
        blockNumber: 1400101,
        target: "FROM_ADDRESS",
        token: "TOKEN_ADDRESS",
        amount: 10,
      },
      augur: {},
    },
    assertions: {
      onAdded: (err, records) => {
        assert.isNull(err);
        assert.deepEqual(records, [{
          owner: "FROM_ADDRESS",
          token: "TOKEN_ADDRESS",
          balance: 9011,
        }]);
      },
      onRemoved: (err, records) => {
        assert.isNull(err);
        assert.deepEqual(records, [{
          owner: "FROM_ADDRESS",
          token: "TOKEN_ADDRESS",
          balance: 9001,
        }]);
      },
    },
  });
});