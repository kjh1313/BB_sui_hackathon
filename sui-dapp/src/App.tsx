import { useState } from 'react';
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const isHexId = (s: string) => /^0x[0-9a-fA-F]{1,64}$/.test(s);

export default function App() {
  const acct = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  // .env에서 기본값 주입 (없으면 빈 값)
  const [packageId, setPackageId] = useState<string>(
    (import.meta.env.VITE_PACKAGE_ID as string) ?? ''
  );
  const [counterId, setCounterId] = useState<string>('');
  const [initValue, setInitValue] = useState<number>(0);
  const [incBy, setIncBy] = useState<number>(1);

  const [lastDigest, setLastDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // .env의 VITE_NETWORK가 없으면 기본 testnet
  const chain = `sui:${(import.meta.env.VITE_NETWORK as string) || 'testnet'}`;

  const handleCreate = async () => {
    try {
      setError(null);
      if (!isHexId(packageId)) {
        setError('packageId 형식 오류 (0x + hex)');
        return;
      }
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::counter::create`,
        arguments: [tx.pure.u64(initValue)],
      });

      // 1) 지갑에 서명/실행 → digest 획득
      const signed = await signAndExecute({ transaction: tx, chain });
      setLastDigest(signed.digest);

      // 2) digest로 풀 결과 조회 (objectChanges 포함)
      const full = await client.waitForTransaction({
        digest: signed.digest,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
      });
      console.log('Full tx result (create):', full);

      const created = (full.objectChanges ?? []).find(
        (c: any) =>
          c.type === 'created' &&
          typeof c.objectType === 'string' &&
          c.objectType.endsWith('::counter::Counter')
      );
      if (created?.objectId) {
        setCounterId(created.objectId);
      } else {
        setError('created Counter를 찾지 못했습니다. 콘솔의 Full tx result 확인');
      }
    } catch (e: any) {
      console.error(e);
      setError(String(e?.message || e));
    }
  };

  const handleIncrease = async () => {
    try {
      setError(null);
      if (!isHexId(packageId)) {
        setError('packageId 형식 오류 (0x + hex)');
        return;
      }
      if (!isHexId(counterId)) {
        setError('counterId 형식 오류 (0x + hex)');
        return;
      }
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::counter::increase`,
        arguments: [tx.object(counterId), tx.pure.u64(incBy)],
      });

      const signed = await signAndExecute({ transaction: tx, chain });
      setLastDigest(signed.digest);

      const full = await client.waitForTransaction({
        digest: signed.digest,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
      });
      console.log('Full tx result (increase):', full);
    } catch (e: any) {
      console.error(e);
      setError(String(e?.message || e));
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2>Sui Counter dApp</h2>

      <ConnectButton />
      <div style={{ marginTop: 8, fontSize: 14 }}>
        {acct ? <>Connected: <b>{acct.address}</b></> : '지갑 연결'}
      </div>

      <hr />

      <label>
        packageId:
        <input
          style={{ width: '100%' }}
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          placeholder="0x..."
        />
      </label>

      <label>
        counterId:
        <input
          style={{ width: '100%' }}
          value={counterId}
          onChange={(e) => setCounterId(e.target.value)}
          placeholder="create 실행 후 자동 채움 시도"
        />
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <label>
          init value:
          <input
            type="number"
            value={initValue}
            onChange={(e) => setInitValue(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </label>
        <button onClick={handleCreate}>create()</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <label>
          increase by:
          <input
            type="number"
            value={incBy}
            onChange={(e) => setIncBy(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </label>
        <button onClick={handleIncrease}>increase()</button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        {lastDigest && <>last digest: <code>{lastDigest}</code></>}
        {error && <div style={{ color: 'crimson' }}>error: {error}</div>}
      </div>
    </div>
  );
}
