import React, { useRef, useEffect } from "react";
import "./freelancer.css";
import { timeAgo } from "../../../utils/helpers/TimeAgo";
import { useState } from "react";
import Chat from "../chat/Chat";
import { toast } from "react-toastify";
import { IoIosChatbubbles, IoIosPerson } from "react-icons/io";
import { useOrderContext } from "../../../providers/OrderProvider";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../providers/AuthProvider";
import ViewMore from "../more/ScrollMore";
import PulseLoader from "react-spinners/PulseLoader";

const BiddersComponent = ({
  orderId,
  client,
  getOrder,
  showBidders,
  setShowBidders,
  showChat,
  setShowChat,
  orderContent,
}) => {
  const [bidder, setBidder] = useState();

  const ordersUrl = `${import.meta.env.VITE_API_URL}/orders/`;

  const [bidders, setBidders] = useState({
    count: null,
    list: null,
    next: null,
  });

  const [loadingBidders, setLoadingBidders] = useState(true);

  const navigate = useNavigate();

  const { updateOrdersAvailable } = useOrderContext();

  const { userToken } = useAuthContext();

  const checkParam = () => {
    const bidderParam = new URLSearchParams(location.search).get("bid");
    if (bidderParam) {
      const bid = bidders.list?.filter((bid) => bid.id === bidderParam);
      setBidder(bid[0]?.freelancer);
    } else {
      setBidder();
    }
  };

  const getBiddersForOrder = async (page) => {
    try {
      const getBidders = await fetch(
        `${ordersUrl}${orderId}/bidders?page=${page}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (getBidders.ok) {
        const response = await getBidders.json();
        setBidders((prev) => {
          return {
            ...prev,
            list: prev.list
              ? prev.list?.concat(response.results)
              : response.results,
            next: response.next,
            count: response.count,
          };
        });
      } else {
        toast.error("Failed to load available bidders!");
      }
    } catch (error) {
      toast.error("We could not find any bidders at the moment!");
    } finally {
      setLoadingBidders(false);
    }
  };

  useEffect(() => {
    orderId && getBiddersForOrder(1);
  }, [orderId]);

  useEffect(() => {
    checkParam();
    const handlePopState = () => {
      checkParam();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const hireFreelancer = async (bidId) => {
    const hireFreelancerUrl = `${import.meta.env.VITE_API_URL}/hire/`;
    try {
      const hireFreelancer = await fetch(hireFreelancerUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bidId: bidId,
        }),
      });

      if (hireFreelancer.ok) {
        toast.success("Your order was allocated");
        getOrder(orderId).then((res) => {
          console.log(res);
          updateOrdersAvailable(res);
        });
      } else {
        toast.error("Order not allocated. Try again!");
      }
    } catch (error) {
      toast.error("Error occurred, try again");
    } finally {
    }
  };

  const startChat = (bidId) => {
    setShowBidders(false);
    window.history.pushState(
      { path: `/order/${orderId}?bid=${bidId}` },
      "",
      `/order/${orderId}?bid=${bidId}`
    );
    checkParam();
  };

  const bidderRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bidderRef.current && !bidderRef.current.contains(event.target)) {
        setShowBidders(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const iconSize = 25;

  return !bidder ? (
    <div
      ref={bidderRef}
      className={`bid-container ${showBidders ? "show-bidder" : "hide-bidder"}`}
    >
      <h1 className="heading" title="Freelancers bidding on your order">
        Active Bidders
        {bidders.list?.length > 0 && <span>{bidders.count}</span>}
      </h1>
      {loadingBidders ? (
        <div>
          <PulseLoader color="#7fc2f5" />
        </div>
      ) : (
        <div className="freelancer-container">
          {bidders.list?.length > 0 ? (
            <>
              {bidders?.list.map((bid, key) => {
                return (
                  <div key={key}>
                    <div className="freelancer">
                      <div>
                        <IoIosPerson
                          size={80}
                          onClick={() =>
                            navigate(
                              `../freelancer-prof/${bid.freelancer.user.username}`
                            )
                          }
                        />
                      </div>
                      <div className="freelancer-container-left">
                        <div className="freelancer-elements">
                          <article>{bid.freelancer.user.username}</article>
                          <span>-</span>
                          <article>Bid {timeAgo(bid.created_at)} ago</article>
                        </div>
                        <div className="bid-actions">
                          <IoIosChatbubbles
                            className="chat-icon"
                            size={iconSize}
                            title="Start chat"
                            onClick={() => startChat(bid.id)}
                          />
                          <article>$ {bid.amount}</article>
                          <button onClick={() => hireFreelancer(bid.id)}>
                            Hire
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {bidders.next && <ViewMore fetch={getBiddersForOrder} />}
            </>
          ) : (
            <div>
              <article style={{ color: "orange", padding: "1rem 0" }}>
                No bids placed yet
              </article>
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    <Chat
      orderId={orderId}
      client={client}
      freelancer={bidder}
      showChat={showChat}
      setShowChat={setShowChat}
    />
  );
};

export default BiddersComponent;
