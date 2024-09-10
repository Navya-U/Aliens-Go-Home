import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getCanvasPosition } from './utils/Formulas';
import Canvas from './components/Canvas';
import * as Auth0 from 'auth0-web';
import io from 'socket.io-client';

Auth0.configure({
  domain: 'dev-ks44a6ctkb0zmsyt.us.auth0.com',
  clientID: 'CLIENT_ID',
  redirectUri: 'http://localhost:3000/',
  responseType: 'token id_token',
  scope: 'openid profile manage:points',
  audience: 'https://aliens-go-home.digituz.com.br',
});

const App = (props) => {
  const socketRef = useRef(null);
  const currentPlayerRef = useRef(null);
  const canvasMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    Auth0.handleAuthCallback();

    const unsubscribe = Auth0.subscribe((auth) => {
      if (!auth) return;

      const playerProfile = Auth0.getProfile();
      currentPlayerRef.current = {
        id: playerProfile.sub,
        maxScore: 0,
        name: playerProfile.name,
        picture: playerProfile.picture,
      };

      props.loggedIn(currentPlayerRef.current);

      socketRef.current = io('http://localhost:3001', {
        query: `token=${Auth0.getAccessToken()}`,
        withCredentials: true,
      });

      socketRef.current.on('players', (players) => {
        props.leaderboardLoaded(players);
        players.forEach((player) => {
          if (player.id === currentPlayerRef.current.id) {
            currentPlayerRef.current = {
              ...currentPlayerRef.current,
              maxScore: player.maxScore,
            };
          }
        });
      });
    });

    const intervalId = setInterval(() => {
      props.moveObjects(canvasMousePositionRef.current);
    }, 10);

    const handleResize = () => {
      const cnv = document.getElementById('aliens-go-home-canvas');
      if (cnv) {
        cnv.style.width = `${window.innerWidth}px`;
        cnv.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [props.moveObjects]);

  useEffect(() => {
    if (
      !props.gameState.started &&
      currentPlayerRef.current &&
      socketRef.current
    ) {
      if (currentPlayerRef.current.maxScore < props.gameState.kills) {
        const updatedPlayer = {
          ...currentPlayerRef.current,
          maxScore: props.gameState.kills,
        };
        socketRef.current.emit('new-max-score', updatedPlayer);
        currentPlayerRef.current = updatedPlayer;
      }
    }
  }, [props.gameState.started, props.gameState.kills]);

  const trackMouse = (event) => {
    canvasMousePositionRef.current = getCanvasPosition(event);
  };

  const shoot = () => {
    props.shoot(canvasMousePositionRef.current);
  };

  return (
    <Canvas
      angle={props.angle}
      currentPlayer={props.currentPlayer}
      gameState={props.gameState}
      players={props.players}
      startGame={props.startGame}
      trackMouse={trackMouse}
      shoot={shoot}
    />
  );
};

App.propTypes = {
  angle: PropTypes.number.isRequired,
  gameState: PropTypes.shape({
    started: PropTypes.bool.isRequired,
    kills: PropTypes.number.isRequired,
    lives: PropTypes.number.isRequired,
  }).isRequired,
  flyingObjects: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
      }).isRequired,
      id: PropTypes.number.isRequired,
    })
  ).isRequired,
  moveObjects: PropTypes.func.isRequired,
  startGame: PropTypes.func.isRequired,
  currentPlayer: PropTypes.shape({
    id: PropTypes.string.isRequired,
    maxScore: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    picture: PropTypes.string.isRequired,
  }),
  leaderboardLoaded: PropTypes.func.isRequired,
  loggedIn: PropTypes.func.isRequired,
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      maxScore: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      picture: PropTypes.string.isRequired,
    })
  ),
  shoot: PropTypes.func.isRequired,
};

App.defaultProps = {
  currentPlayer: null,
  players: null,
};

export default App;
