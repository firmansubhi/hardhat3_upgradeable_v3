// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract Dorz2 is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    //decimal value of percentage
    uint256 public constant PERCENTAGE_DECIMAL = 10 ** 2;

    // Custom Errors for Clarity
    error InvalidAllocationAddress(string label);
    error PercentageSumExceeds100();
    error TotalSupplyMismatch();

    // Custom Event for Distribution Transparency
    event TokensAllocated(
        address indexed recipient,
        string label,
        uint256 amount
    );

    // Using a struct for better readability of the allocation logic
    struct Allocation {
        address wallet;
        uint256 percentage;
        string label;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address vestingWallet,
        address teamWallet
    ) public initializer {
        __ERC20_init("DORZ", "DORZ");
        __Ownable_init(initialOwner);

        Allocation[3] memory allocations = [
            Allocation(initialOwner, 15, "Owner"),
            Allocation(vestingWallet, 80, "Vesting"),
            Allocation(teamWallet, 5, "Team")
        ];

        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < allocations.length; i++) {
            Allocation memory current = allocations[i];

            if (current.wallet == address(0)) {
                revert InvalidAllocationAddress(current.label);
            }

            totalPercentage += current.percentage;
            uint256 amount = (MAX_SUPPLY * current.percentage) /
                PERCENTAGE_DECIMAL;

            _mint(current.wallet, amount);
            emit TokensAllocated(current.wallet, current.label, amount);
        }

        if (totalPercentage > 100) {
            revert PercentageSumExceeds100();
        }

        uint256 mintedSoFar = totalSupply();
        if (mintedSoFar < MAX_SUPPLY) {
            uint256 remaining = MAX_SUPPLY - mintedSoFar;
            _mint(initialOwner, remaining);
            emit TokensAllocated(initialOwner, "Owner Treasury", remaining);
        }

        if (totalSupply() != MAX_SUPPLY) {
            revert TotalSupplyMismatch();
        }
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

	function testUpgrade(address initialOwner) public {
        
		_mint(initialOwner, 123_000_000 * 10 ** decimals());
    }
}
