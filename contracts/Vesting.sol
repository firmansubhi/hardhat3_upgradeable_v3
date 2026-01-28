//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

import "./Dorz.sol";

error InsufficientOwnerBalance(uint256 balance);
error FailedWithdraw();
error InvalidEthQty();
error InvalidUsdQty();
error InvalidVestingAmount();
error InvalidOrderNumber();
error OrderNumberIsUsed();
error InvalidAccount();
error UnauthorizedAccount();
error VestingAlreadyClaimed();
error InvalidWithdrawalTime(uint256 allowedTime);
error InsufficientSupply(uint256 vestingBalance);
error TransferFailed();

contract Vesting is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    Dorz public myToken;

    AggregatorV3Interface internal dataFeed;
    AggregatorV3Interface internal dataFeedMyCoin;

    //price simulation for USD & ETH for testing
    int256 public usdEthPrice;
    int256 public myCoinUsdPrice;

    //apr rate percentage
    int256 public APR_RATE;

    //variable to store the increment value of the vesting order
    uint256 public dataIncrement;

    //decimal value of price feed aggregator
    int256 public constant PRICE_FEED_DECIMAL = 10 ** 8;

    //decimal value of percentage
    int256 public constant PERCENTAGE_DECIMAL = 10 ** 2;

    receive() external payable {}

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address dorzProxy,
        address EthtoUsd,
        address MyCoinperUSD
    ) public initializer {
        __Ownable_init(msg.sender);

        usdEthPrice = 1000 * PRICE_FEED_DECIMAL; // 1 eth = 1000 usd
        myCoinUsdPrice = 100 * PRICE_FEED_DECIMAL; // 1 usd = 100 dorz
        APR_RATE = 20 * PERCENTAGE_DECIMAL;
        dataIncrement = 0;

        //address chainlink for get ETH to USD price
        dataFeed = AggregatorV3Interface(EthtoUsd);

        //address chainlink for get DOrz to USD price
        dataFeedMyCoin = AggregatorV3Interface(MyCoinperUSD);

        myToken = Dorz(dorzProxy);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @notice Allow the owner of the contract to withdraw ETH
     */
    function withdraw() public onlyOwner {
        uint256 ownerBalance = address(this).balance;
        if (ownerBalance < 1) {
            revert InsufficientOwnerBalance(ownerBalance);
        }

        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        if (!sent) {
            revert FailedWithdraw();
        }
    }

    /**
     * @notice get ETH balance
     */
    function vdETHBalance()
        public
        view
        onlyOwner
        returns (uint256 tokenAmount)
    {
        uint256 ownerBalance = address(this).balance;
        return ownerBalance;
    }

    struct Vest {
        address userAddress;
        uint256 order;
        uint256 dataID;
        bool isInitialized;
    }

    struct VestData {
        int256 amount;
        int256 aprAmount;
        uint256 lockUpTime;
        uint256 coinClaimed;
        uint256 claimTime;
        bool claimStatus;
    }

    mapping(address => mapping(uint256 => Vest)) public Vests;
    mapping(uint256 => VestData) public VestingData;

    /**
     * @notice return USD price per 1 ETH
     */
    function getPriceUSDperETH() public view returns (int256) {
        //uncomment to return real price from aggregator
        //(, int256 answer, , , ) = dataFeed.latestRoundData();
        //return answer;

        //return mock up data
        return usdEthPrice;
    }

    /**
     * @notice return OThree price per 1 USD
     */
    function getPriceMyCoinperUSD() public view returns (int256) {
        //uncomment to return real price from aggregator
        //(, int256 answer, , , ) = dataFeedMyCoin.latestRoundData();
        //return answer;
        //return mock up data
        return myCoinUsdPrice;
    }

    /**
     * @notice return USD value and APR in USD from ETH to be paid
     */
    function getUSDAmount(int256 ethQty) public view returns (int256, int256) {
        if (ethQty < 1) {
            revert InvalidEthQty();
        }

        int256 usdPrice = getPriceUSDperETH();
        int256 val = (usdPrice * ethQty) / PRICE_FEED_DECIMAL;
        int256 apr = (((usdPrice * ethQty) * APR_RATE) /
            (100 * PERCENTAGE_DECIMAL)) / PRICE_FEED_DECIMAL;

        return (val, apr);
    }

    function getCoinQtyByUSD(int256 total) public view returns (uint256) {
        int256 myCoinPrice = getPriceMyCoinperUSD();
        int256 coinQty = (total * myCoinPrice) / 1e8;
        return uint256(coinQty);
    }

    /**
     * @notice return ETH value and APR in USD from USD to be paid
     */
    function getETHAmount(int256 usdQty) public view returns (int256, int256) {
        if (usdQty < 1) {
            revert InvalidUsdQty();
        }

        int256 usdPrice = getPriceUSDperETH();
        int256 val = (usdQty * PRICE_FEED_DECIMAL) / usdPrice;
        int256 apr = ((usdQty * APR_RATE) / (100 * PERCENTAGE_DECIMAL));

        return (val, apr);
    }

    event CreateVest(
        address buyer,
        uint256 amountOfETH,
        int256 amountOfUSD,
        int256 amountOfAPR,
        uint256 lockTime
    );

    event ClaimVest(
        address sender,
        uint256 coinQty,
        int256 amountOfUSD,
        int256 amountOfAPR
    );

    function createVest(
        uint256 orderNumber
    ) public payable returns (int256, int256, uint256) {
        if (msg.value < 1) {
            revert InvalidVestingAmount();
        }

        if (orderNumber < 1) {
            revert InvalidOrderNumber();
        }

        bool isExist = checkVestOrderExist(orderNumber);
        if (isExist) {
            revert OrderNumberIsUsed();
        }

        int256 val = int256(msg.value);
        (int256 amount, int256 apr) = getUSDAmount(val);
        uint256 lockUpTime = block.timestamp - 1 days;
        uint256 claimTime;
        uint256 coinClaimed;

        buildVest(orderNumber, amount, apr, lockUpTime, claimTime, coinClaimed);

        emit CreateVest(msg.sender, msg.value, amount, apr, lockUpTime);

        return (amount, apr, lockUpTime);
    }

    function buildVest(
        uint256 orderNumber,
        int256 amount,
        int256 apr,
        uint256 lockUpTime,
        uint256 claimTime,
        uint256 coinClaimed
    ) public payable {
        dataIncrement++;

        Vests[msg.sender][orderNumber] = Vest({
            userAddress: msg.sender,
            order: orderNumber,
            dataID: dataIncrement,
            isInitialized: true
        });

        VestingData[dataIncrement] = VestData({
            amount: amount,
            aprAmount: apr,
            lockUpTime: lockUpTime,
            coinClaimed: coinClaimed,
            claimTime: claimTime,
            claimStatus: false
        });
    }

    function checkVestOrderExist(uint256 order) public view returns (bool) {
        return Vests[msg.sender][order].isInitialized;
    }

    function getVestDataID(
        uint256 orderNumber
    ) public view returns (bool, uint256) {
        uint256 dataID;

        bool isExist = checkVestOrderExist(orderNumber);

        if (isExist) {
            dataID = Vests[msg.sender][orderNumber].dataID;
            return (true, dataID);
        } else {
            return (false, dataID);
        }
    }

    function getVest(
        uint256 orderNumber
    ) public view returns (int256, int256, uint256, uint256, uint256, bool) {
        (bool isExist, uint256 dataID) = getVestDataID(orderNumber);
        if (!isExist) {
            revert InvalidAccount();
        }

        return (
            VestingData[dataID].amount,
            VestingData[dataID].aprAmount,
            VestingData[dataID].lockUpTime,
            VestingData[dataID].coinClaimed,
            VestingData[dataID].claimTime,
            VestingData[dataID].claimStatus
        );
    }

    function claimVest(uint256 orderNumber) public payable returns (uint256) {
        (bool isExist, uint256 id) = getVestDataID(orderNumber);
        if (!isExist) {
            revert UnauthorizedAccount();
        }

        if (VestingData[id].claimStatus) {
            revert VestingAlreadyClaimed();
        }

        if (VestingData[id].lockUpTime > block.timestamp) {
            revert InvalidWithdrawalTime(VestingData[id].lockUpTime);
        }

        int256 total = VestingData[id].amount + VestingData[id].aprAmount;
        uint256 qty = getCoinQtyByUSD(total);

        uint256 vestingBalance = myToken.balanceOf(address(this));
        if (vestingBalance < qty) {
            revert InsufficientSupply(vestingBalance);
        }

        bool sent = myToken.transfer(msg.sender, qty);
        if (!sent) {
            revert TransferFailed();
        }

        VestingData[id].coinClaimed = qty;
        VestingData[id].claimTime = block.timestamp;
        VestingData[id].claimStatus = true;

        emit ClaimVest(
            msg.sender,
            qty,
            VestingData[id].amount,
            VestingData[id].aprAmount
        );

        return qty;
    }

    function getMyCoinUSD() public view returns (int256) {
        uint256 myBalance = myToken.balanceOf(msg.sender);
        int256 myCoinPrice = getPriceMyCoinperUSD();
        int256 myUsd = (int256(myBalance) / myCoinPrice) / PERCENTAGE_DECIMAL;

        return myUsd;
        //return (myBalance, myUsd);
    }
}
