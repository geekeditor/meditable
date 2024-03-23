
import { generateId } from './utils'

export interface EventListener {
    /**
     * Listener unique identifier
     */
    id: string;

    /**
     * Element where to listen to dispatched events
     */
    element: EventTarget;

    /**
     * Event to listen
     */
    eventType: string;

    /**
     * Event handler
     *
     * @param {Event} event - event object
     */
    handler: (event: Event) => void;

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     */
    options: boolean | AddEventListenerOptions;
}

export default class EventListeners {
 
    private allEventListeners: EventListener[] = [];

    /**
     * Assigns event listener on element and returns unique identifier
     *
     * @param {EventTarget} element - DOM element that needs to be listened
     * @param {string} eventType - event type
     * @param {Function} handler - method that will be fired on event
     * @param {boolean|AddEventListenerOptions} options - useCapture or {capture, passive, once}
     *
     * @returns {string}
     */
    public on(
        element: EventTarget,
        eventType: string,
        handler: (event: Event) => void,
        options: boolean | AddEventListenerOptions = false
    ): string | undefined {
        const id = generateId();
        const assignedEventData = {
            id,
            element,
            eventType,
            handler,
            options,
        };

        const alreadyExist = this.allEventListeners.some((listener) => {
            if (listener.element === element && listener.eventType === eventType && listener.handler === handler) {
                return true;
            }
            return false
        });

        if (alreadyExist) {
            return;
        }

        this.allEventListeners.push(assignedEventData);
        element.addEventListener(eventType, handler, options);

        return id;
    }

    /**
     * Removes listener by id
     *
     * @param {string} id - listener identifier
     */
    public off(id: string) {
        const listener = this.allEventListeners.find((listener) => listener.id === id);

        if (!listener) {
            return;
        }

        listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
    }

    /**
     * Removes all listeners
     */
    public removeAllEventListeners(): void {
        this.allEventListeners.map((listener) => {
            listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
        });

        this.allEventListeners = [];
    }
}
