// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.11;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint256 minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint256 value;
        address payable recipient;
        bool complete;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    mapping(uint256 => Request) requests;
    address public manager;
    uint256 public minimumContribution;
    mapping(address => bool) public approvers;
    uint256 public approversCount;

    mapping(address => bool) requestpprovals;

    modifier onlyOwner() {
        require(msg.sender == manager);
        _;
    }

    constructor(uint256 minimum, address creator) {
        manager = creator;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(
            msg.value >= minimumContribution,
            "Amount sent is less than the minimum contribution limit."
        );

        approvers[msg.sender] = true;
        approversCount++;
    }

    uint256 numRequests;

    function createRequest(
        string memory description,
        uint256 value,
        address payable recipient
    ) public onlyOwner {
        require(
            value <= address(this).balance,
            "Not enough money to request that amount"
        );
        Request storage r = requests[numRequests++];

        r.description = description;
        r.value = value;
        r.recipient = recipient;
        r.complete = false;
        r.approvalCount = 0;
    }

    function approveRequest(uint256 index) public {
        Request storage request = requests[index];

        require(approvers[msg.sender], "You are not an approver.");
        require(
            request.approvals[msg.sender] == false,
            "You have already voted on this request."
        );
        require(request.complete == false, "Request was already finalized.");

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint256 index) public onlyOwner {
        Request storage request = requests[index];

        require(request.complete == false, "Request was already finalized.");
        require(
            request.approvalCount > (approversCount / 2),
            "Not enough approvals."
        );

        request.recipient.transfer(request.value);
        request.complete = true;
    }
}
