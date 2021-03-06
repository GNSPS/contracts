import * as _ from 'lodash';
import * as chai from 'chai';
import {chaiSetup} from '../../../util/chai_setup';
import { testUtil } from '../../../util/test_util';
import { ContractInstance } from '../../../util/types';

chaiSetup.configure();
const expect = chai.expect;

const Proxy = artifacts.require('./db/Proxy.sol');

contract('Proxy', (accounts: string[]) => {
  const owner = accounts[0];
  const notOwner = accounts[1];

  let proxy: ContractInstance;
  let authorized: string;
  let notAuthorized = owner;

  before(async () => {
    proxy = await Proxy.deployed();
  });

  describe('addAuthorizedAddress', () => {
    it('should throw if not called by owner', async () => {
      try {
        await proxy.addAuthorizedAddress(notOwner, { from: notOwner });
        throw new Error('addAuthorizedAddress succeeded when it should have thrown');
      } catch (err) {
        testUtil.assertThrow(err);
      }
    });

    it('should allow owner to add an authorized address', async () => {
      await proxy.addAuthorizedAddress(notAuthorized, { from: owner });
      authorized = notAuthorized;
      notAuthorized = null;
      const isAuthorized = await proxy.authorized.call(authorized);
      expect(isAuthorized).to.be.true();
    });

    it('should throw if owner attempts to authorize a duplicate address', async () => {
      try {
        await proxy.addAuthorizedAddress(authorized, { from: owner });
        throw new Error('addAuthorizedAddress succeeded when it should have thrown');
      } catch (err) {
        testUtil.assertThrow(err);
      }
    });
  });

  describe('removeAuthorizedAddress', () => {
    it('should throw if not called by owner', async () => {
      try {
        await proxy.removeAuthorizedAddress(authorized, { from: notOwner });
        throw new Error('removeAuthorizedAddress succeeded when it should have thrown');
      } catch (err) {
        testUtil.assertThrow(err);
      }
    });

    it('should allow owner to remove an authorized address', async () => {
      await proxy.removeAuthorizedAddress(authorized, { from: owner });
      notAuthorized = authorized;
      authorized = null;

      const isAuthorized = await proxy.authorized.call(notAuthorized);
      expect(isAuthorized).to.be.false();
    });

    it('should throw if owner attempts to remove an address that is not authorized', async () => {
      try {
        await proxy.removeAuthorizedAddress(notAuthorized, { from: owner });
        throw new Error('removeAuthorizedAddress succeeded when it should have thrown');
      } catch (err) {
        testUtil.assertThrow(err);
      }
    });
  });

  describe('getAuthorizedAddresses', () => {
    it('should return all authorized addresses', async () => {
      const initial = await proxy.getAuthorizedAddresses();
      expect(initial).to.have.lengthOf(1);
      await proxy.addAuthorizedAddress(notAuthorized, { from: owner });

      authorized = notAuthorized;
      notAuthorized = null;
      const afterAdd = await proxy.getAuthorizedAddresses();
      expect(afterAdd).to.have.lengthOf(2);
      expect(afterAdd).to.include(authorized);

      await proxy.removeAuthorizedAddress(authorized, { from: owner });
      notAuthorized = authorized;
      authorized = null;
      const afterRemove = await proxy.getAuthorizedAddresses();
      expect(afterRemove).to.have.lengthOf(1);
    });
  });
});
