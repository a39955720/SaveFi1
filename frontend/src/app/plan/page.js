import Head from "next/head";
import Header from "../../components/Header";
import Plan from "../../components/Plan";

export default function () {
  return (
    <div className="flex-col min-h-screen">
      <Head>
        <title>SaveFi</title>
        <meta
          name="description"
          content="AI-powered savings platform with DeFi yield, rewards, and smart contracts."
        />
      </Head>
      <Header />
      <Plan />
    </div>
  );
}
