import React from 'react';
import clsx from "clsx";
import jexl from 'jexl';
import CodeMirror from '@uiw/react-codemirror';
import {json as jsonLanguage} from "@codemirror/lang-json";

import styles from './styles.module.css';

interface Props {
    children: typeof React.Children;
    expression: string;
    height: string;
    title: string;
}

const getNodeText = (node) => {
    if (['string', 'number'].includes(typeof node)) return node;
    if (node instanceof Array) return node.map(getNodeText).join('');
    if (typeof node === 'object' && node) return getNodeText(node.props.children);
}

export default function ExpressionPlayground({
   children,
   expression = 'field',
   height = '200px',
   title = 'Expression Playground'
}: Props): JSX.Element {
    const [expValue, setExpValue] = React.useState(expression);
    let text = getNodeText(children).replace(/^\/\s*([\s\S]*)\s*\/$/m, '$1');
    try {
        text = JSON.stringify(JSON.parse(text), null, 2); // prettify
    } catch (err) {
        text = err.message;
    }
    const [cmValue, setCmValue] = React.useState(text);
    const resElement = React.useRef<HTMLDivElement>();
    React.useEffect(() => {
        const evaluate = async() => {
            const context = JSON.parse(cmValue);
            const val = await jexl.eval(expValue, context)
            return JSON.stringify(val, null, 2); // prettify
        }
        evaluate()
            .then((res) => {
                const {current} = resElement;
                current.textContent = res;
                current.parentElement.classList.remove('alert--danger');
                current.parentElement.classList.add('alert--success');
            })
            .catch((err) => {
                const {current} = resElement;
                current.textContent = err.message;
                current.parentElement.classList.remove('alert--success');
                current.parentElement.classList.add('alert--danger');
            })

        }, [expValue, cmValue]);

    return (
        <div className={styles.expressionPlayground}>
            <div className={styles.expressionPlaygroundHeader}>
                <div className={styles.buttons}>
                    <span className={styles.dot} style={{background: '#f25f58'}} />
                    <span className={styles.dot} style={{background: '#fbbe3c'}} />
                    <span className={styles.dot} style={{background: '#58cb42'}} />
                </div>
                <div className={clsx(styles.expressionPlaygroundTitle, 'text--truncate')}>
                    {title}
                </div>
                {/*
                <div className={styles.expressionPlaygroundMenuIcon}>
                  <div>
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                  </div>
                </div>
                */}
            </div>
            <div className={styles.expressionPlaygroundBody}>
                <div className={styles.expressionPlaygroundContent}>
                    <div className={styles.expressionPlayGroundSectionTitle}>Json Data:</div>
                    <CodeMirror
                        value={cmValue}
                        height={height}
                        extensions={[jsonLanguage()]}
                        onChange={(value, viewUpdate) => { setCmValue(value); }} />
                    <div className={styles.expressionPlayGroundSectionTitle}>Expression:&nbsp;</div>
                    <input className={styles.expressionPlayGroundInput} type="text" value={expValue} onChange={(evt) => { setExpValue(evt.target.value); }}/>
                    <div className={styles.expressionPlayGroundSectionTitle}>Result:</div>
                    <div className={"alert alert--success"} role="alert">
                        <div ref={resElement} className={styles.expressionPlayGroundResult}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}